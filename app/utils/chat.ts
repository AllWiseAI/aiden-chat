import { REQUEST_TIMEOUT_MS, DEFAULT_USER_DELINETED } from "@/app/constant";
import { t } from "i18next";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "./format";
import { fetch as tauriFetch } from "./stream";
import {
  showConfirm,
  ConfirmType,
} from "@/app/components/confirm-modal/confirm";
import { useSettingStore } from "@/app/store/setting";
import { McpStepsAction, ChatModelInfo } from "../typing";

const settingStore = useSettingStore.getState();

type TMcpInfo = {
  id: string;
  thread_id: string;
  tool: string;
  type: string;
  result: string;
};

type TParseSSEResult = {
  isMcpInfo: boolean;
  content?: string;
  mcpInfo?: TMcpInfo;
};

export function getChatHeaders(modelInfo: ChatModelInfo) {
  if (modelInfo.apiKey) {
    // custom model
    const { default_endpoint, apiKey, provider, model } = modelInfo;
    return {
      "Aiden-Model-Name": model,
      "Aiden-Endpoint": default_endpoint,
      "Aiden-Model-Provider": provider,
      "Aiden-Model-Api-Key": apiKey,
    };
  }
  return {
    "Aiden-Model-Name": modelInfo?.model,
    "Aiden-Endpoint": modelInfo?.endpoint,
    "Aiden-Model-Provider": modelInfo?.provider,
  };
}

export function parseSSE(text: string): TParseSSEResult {
  const json = JSON.parse(text);
  console.log("[Request] openai chat resJson: ", json);
  const choices = json.choices;
  const extra = json.extra;
  if (!choices?.length) {
    if (
      extra &&
      extra.mcp &&
      extra.mcp.type === McpStepsAction.ToolCallConfirm
    ) {
      console.log("tool_call_confirm: ", extra.mcp);
      return {
        isMcpInfo: true,
        mcpInfo: extra.mcp,
        content: `\r\n${extra.mcp.tool}\r\n::loading[]\r\n`,
      };
    } else if (
      extra &&
      extra.mcp &&
      extra.mcp.type === McpStepsAction.ToolResult
    ) {
      console.log("tool_result: ", extra.mcp);
      return {
        isMcpInfo: true,
        mcpInfo: extra.mcp,
        content: `\r\n${extra.mcp.result}\r\n`,
      };
    }
  }

  const content = choices[0]?.delta?.content;

  if (!content || content.length === 0) {
    return {
      isMcpInfo: false,
      content: "",
    };
  }
  return {
    isMcpInfo: false,
    content: content,
  };
}
export function stream(
  chatPath: string,
  requestPayload: any,
  headers: any,
  tools: any[],
  funcs: Record<string, Function>,
  controller: AbortController,
  parseSSE: (text: string) => string | undefined,
  processToolMessage: (
    requestPayload: any,
    toolCallMessage: any,
    toolCallResult: any[],
  ) => void,
  options: any,
) {
  let responseText = "";
  let remainText = "";
  let finished = false;
  let running = false;
  const runTools: any[] = [];
  let responseRes: Response;

  // animate response to make it looks smooth
  function animateResponseText() {
    if (finished || controller.signal.aborted) {
      responseText += remainText;
      if (controller.signal.aborted) {
        options.onError?.(new Error("User canceled"));
        return;
      }
      if (responseText?.length === 0) {
        options.onError?.(new Error("empty response from server"));
      }
      return;
    }

    if (remainText.length > 0) {
      const fetchCount = Math.max(1, Math.round(remainText.length / 60));
      const fetchText = remainText.slice(0, fetchCount);
      responseText += fetchText;
      remainText = remainText.slice(fetchCount);
      options.onUpdate?.(responseText);
    }

    requestAnimationFrame(animateResponseText);
  }

  // start animaion
  animateResponseText();

  const finish = () => {
    if (!finished) {
      if (!running && runTools.length > 0) {
        const toolCallMessage = {
          role: "assistant",
          tool_calls: [...runTools],
        };
        running = true;
        runTools.splice(0, runTools.length); // empty runTools
        return Promise.all(
          toolCallMessage.tool_calls.map((tool) => {
            options?.onBeforeTool?.(tool);
            return Promise.resolve(
              funcs[tool.function.name](
                tool?.function?.arguments
                  ? JSON.parse(tool?.function?.arguments)
                  : {},
              ),
            )
              .then((res) => {
                let content = res.data || res?.statusText;
                // hotfix #5614
                content =
                  typeof content === "string"
                    ? content
                    : JSON.stringify(content);
                if (res.status >= 300) {
                  return Promise.reject(content);
                }
                return content;
              })
              .then((content) => {
                options?.onAfterTool?.({
                  ...tool,
                  content,
                  isError: false,
                });
                return content;
              })
              .catch((e) => {
                options?.onAfterTool?.({
                  ...tool,
                  isError: true,
                  errorMsg: e.toString(),
                });
                return e.toString();
              })
              .then((content) => ({
                name: tool.function.name,
                role: "tool",
                content,
                tool_call_id: tool.id,
              }));
          }),
        ).then((toolCallResult) => {
          processToolMessage(requestPayload, toolCallMessage, toolCallResult);
          setTimeout(() => {
            // call again
            console.debug("[ChatAPI] restart");
            running = false;
            chatApi(chatPath, headers, requestPayload); // call fetchEventSource
          }, 60);
        });
        return;
      }
      if (running) {
        return;
      }
      console.debug("[ChatAPI] end");
      finished = true;
      options.onFinish(responseText + remainText, responseRes); // 将res传递给onFinish
    }
  };

  controller.signal.onabort = finish;

  function chatApi(chatPath: string, headers: any, requestPayload: any) {
    const chatPayload = {
      method: "POST",
      body: JSON.stringify({
        ...requestPayload,
      }),
      signal: controller.signal,
      headers,
    };
    const requestTimeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );
    fetchEventSource(chatPath, {
      fetch: tauriFetch as any,
      ...chatPayload,
      async onopen(res) {
        clearTimeout(requestTimeoutId);
        const contentType = res.headers.get("content-type");
        responseRes = res;

        if (contentType?.startsWith("text/plain")) {
          responseText = await res.clone().text();
          return finish();
        }

        if (
          !res.ok ||
          !res.headers
            .get("content-type")
            ?.startsWith(EventStreamContentType) ||
          res.status !== 200
        ) {
          const responseTexts = [responseText];
          let extraInfo = await res.clone().text();
          try {
            const resJson = await res.clone().json();
            extraInfo = prettyObject(resJson);
          } catch {}

          if (res.status === 401) {
            responseTexts.push(t("error.unauthorized"));
          }

          if (extraInfo) {
            responseTexts.push(extraInfo);
          }

          responseText = responseTexts.join("\n\n");

          return finish();
        }
      },
      onmessage(msg) {
        if (msg.data === "[DONE]" || finished) {
          return finish();
        }
        const text = msg.data;
        // Skip empty messages
        if (!text || text.trim().length === 0) {
          return;
        }
        try {
          const chunk = parseSSE(text);
          if (chunk) {
            remainText += chunk;
          }
        } catch (e) {
          console.error("[Request] parse error", text, msg, e);
        }
      },
      onclose() {
        finish();
      },
      onerror(e) {
        options?.onError?.(e);
        throw e;
      },
      openWhenHidden: true,
    });
  }
  console.debug("[ChatAPI] start");
  chatApi(chatPath, headers, requestPayload); // call fetchEventSource
}

export function streamWithThink(
  chatPath: string,
  requestPayload: any,
  headers: any,
  controller: AbortController,
  parseSSE: (text: string) => TParseSSEResult,
  options: any,
  text = "",
) {
  let responseText = text;
  let remainText = "";
  let finished = false;
  let hasConfirmRequest = false;
  let responseRes: Response;

  function animateResponseText() {
    if (finished || controller.signal.aborted) {
      responseText += remainText;
      console.log("[Response Animation] finished");
      if (controller.signal.aborted) {
        options.onError?.(new Error("User canceled"), true);
        return;
      }
      if (!hasConfirmRequest && responseText?.length === 0) {
        options.onError?.(new Error("empty response from server"), true);
      }
      return;
    }

    if (remainText.length > 0) {
      const fetchCount = Math.max(1, Math.round(remainText.length / 60));
      const fetchText = remainText.slice(0, fetchCount);
      responseText += fetchText;
      remainText = remainText.slice(fetchCount);
      options.onUpdate?.(responseText);
    }

    requestAnimationFrame(animateResponseText);
  }

  animateResponseText();

  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    options.onFinish(responseText + remainText, responseRes);
  };

  controller.signal.onabort = finish;

  async function chatApi(chatPath: string, headers: any, requestPayload: any) {
    console.log("[Request] request chatApi: ", chatPath);
    const chatPayload = {
      method: "POST",
      body: JSON.stringify({
        ...requestPayload,
        stream: true,
      }),
      signal: controller.signal,
      headers: {
        ...headers,
        Accept: "text/event-stream",
      },
    };
    console.log("[Request] chatApi payload headers: ", chatPayload.headers);
    const requestTimeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );
    fetchEventSource(chatPath, {
      fetch: tauriFetch as any,
      ...chatPayload,
      async onopen(res) {
        clearTimeout(requestTimeoutId);
        const contentType = res.headers.get("content-type");
        responseRes = res;

        if (contentType?.startsWith("text/plain")) {
          responseText = await res.clone().text();
          return finish();
        }

        if (
          !res.ok ||
          !res.headers
            .get("content-type")
            ?.startsWith(EventStreamContentType) ||
          res.status !== 200
        ) {
          const responseTexts = [responseText];
          let extraInfo = await res.clone().text();
          try {
            const resJson = await res.clone().json();
            extraInfo = prettyObject(resJson);
          } catch {}

          if (res.status === 401) {
            responseTexts.push(t("error.unauthorized"));
          }

          if (extraInfo) {
            responseTexts.push(extraInfo);
          }

          responseText = responseTexts.join("\n\n");

          return finish();
        }
      },
      async onmessage(msg) {
        responseText = responseText.replace("::loading[]", "");
        if (msg.data === "[DONE]" || finished) {
          return finish();
        }
        const text = msg.data;
        // Skip empty messages
        if (!text || text.trim().length === 0) {
          return;
        }
        try {
          const chunk = parseSSE(text);

          if (!chunk?.content || chunk.content.length === 0) {
            return;
          }

          if (chunk.mcpInfo) {
            const { type } = chunk.mcpInfo;
            if (type === McpStepsAction.ToolCallConfirm) {
              hasConfirmRequest = true;
              // should check if user has approved the MCP
              const userHasApproved = settingStore.getUserMcpApproveStatus(
                chunk.mcpInfo.tool,
              );

              let approved = false;
              if (userHasApproved) {
                console.log(
                  "[MCP confirm] User has approved before. No need to show confirm modal. ",
                );
                approved = true;
              } else {
                console.log(
                  "[MCP confirm] No user approval before. Show confirm modal.  ",
                );
                const result = await showConfirm({
                  title: "Aiden " + t("dialog.mcpTitle"),
                  description: chunk.mcpInfo.tool,
                });
                approved = [ConfirmType.Always, ConfirmType.Once].includes(
                  result as ConfirmType,
                );
                if (result === ConfirmType.Always) {
                  console.log(
                    "[MCP confirm] User approved. Set user approval status to true.",
                  );
                  settingStore.setUserMcpApproveStatus(
                    chunk.mcpInfo.tool,
                    true,
                  );
                }
                if (result === ConfirmType.Decline) {
                  console.log("[MCP confirm] User rejected.");
                  options.onUpdate?.(responseText, {
                    response: DEFAULT_USER_DELINETED,
                  });
                }
              }
              options.onToolCall({
                approved,
                tool_call_id: chunk.mcpInfo.id,
                thread_id: chunk.mcpInfo.thread_id,
                title: chunk.mcpInfo.tool,
                request: prettyObject(chunk.mcpInfo || "") + "\n\n",
              });
            } else if (type === McpStepsAction.ToolResult) {
              console.log("[MCP] Tool result: ", chunk.mcpInfo.result);
              options.onUpdate?.(responseText, {
                response: chunk.mcpInfo.result,
              });
            }
          } else {
            remainText += chunk.content;
          }
        } catch (e) {
          console.error("[Request] parse error", text, msg, e);
          // Don't throw error for parse failures, just log them
        }
      },
      onclose() {
        finish();
      },
      onerror(e) {
        console.error("[Request] stream error", e);
        options?.onError?.(e, true);
        throw e;
      },
      openWhenHidden: true,
    });
  }
  console.debug("[ChatAPI] start");
  chatApi(chatPath, headers, requestPayload); // call fetchEventSource
}
