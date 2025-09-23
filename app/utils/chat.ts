import { REQUEST_TIMEOUT_MS, ALLOW_TOOL_LIST } from "@/app/constant";
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
import { McpStepsAction, ProviderOption } from "../typing";
import { uploadFileWithProgress } from "../services/file";

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
  rawResp?: {
    msg?: string;
    code?: number | string;
  };
};

type MCPInfo = {
  type: string;
  tool?: string;
  args?: any;
  id?: string;
  result?: string;
  thread_id?: string;
  [key: string]: any;
};

type MCPFormatted = {
  role: string;
  content: string;
  mcpInfo?: {
    title: string;
    request: string;
    response: string;
  };
};

export function formatMCPData(data: any[]): MCPFormatted[] {
  const result: MCPFormatted[] = [];
  let lastToolResult: string | undefined = undefined;

  for (let i = data.length - 1; i >= 0; i--) {
    const item = data[i];
    const role = item.message?.role;
    const content = item.message?.content;
    const mcp: MCPInfo | undefined = item.extra?.mcp;

    // tool_result 类型：更新 lastToolResult，跳过本条
    if (mcp?.type === "tool_result") {
      if (typeof mcp.result === "string") {
        lastToolResult = mcp.result;
      }
    }

    // 如果是 tool_call_confirm 类型，没有 content，有 mcp，构造 mcpInfo
    if (mcp && mcp.type === "tool_call_confirm") {
      result.push({
        role,
        content: "",
        mcpInfo: {
          title: mcp.tool || "",
          request: JSON.stringify(mcp, null, 2),
          response: lastToolResult || "",
        },
      });
    }

    // 如果 content 有内容，直接输出
    if (content && content.trim() !== "") {
      result.push({ role, content });
    }
  }

  return result.reverse();
}

export function getChatHeaders(modelInfo: ProviderOption) {
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
  const message = json.message;
  const extra = json.extra;
  if (!choices && message?.content && message?.content?.length) {
    return {
      isMcpInfo: false,
      content: message?.content ?? [],
    };
  }

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

  const content = choices?.[0]?.delta?.content || "";
  if (!content || content.length === 0) {
    const errorMsg = choices?.[0]?.delta?.msg || "";
    /**
     * 
     * "choices": [
      {
        "delta": {
          "msg": "An error seems to have occurred. Please try again later.\nError code: 401 - {'error': 'Invalid JWT token'}",
          "code": "-1"
        }
      }
    ]
     */
    if (errorMsg.includes("code: 401")) {
      window.location.href = "/#/login";
    }

    return {
      isMcpInfo: false,
      content: "",
      rawResp: choices?.[0]?.delta,
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
  let responseRes: Response;

  function animateResponseText() {
    if (finished || controller.signal.aborted) {
      responseText += remainText;
      console.log("[Response Animation] finished");
      if (controller.signal.aborted) {
        options.onError?.(new Error("User canceled"), true);
        return;
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
        console.log("msg===", msg);
        const text = msg.data;
        // Skip empty messages
        if (!text || text.trim().length === 0) {
          return;
        }
        try {
          const chunk = parseSSE(text);

          if (!chunk?.content || chunk.content.length === 0) {
            const { msg, code } = chunk.rawResp || {};
            if (msg || code) {
              options.onError(chunk.rawResp, true);
            }
            return;
          }
          if (chunk.mcpInfo) {
            const { type } = chunk.mcpInfo;
            if (type === McpStepsAction.ToolCallConfirm) {
              // should check if user has approved the MCP
              const userHasApproved = settingStore.getUserMcpApproveStatus(
                chunk.mcpInfo.tool,
              );

              let approved = false;
              const toolName = chunk.mcpInfo.tool;
              const isInAllowList = ALLOW_TOOL_LIST.includes(toolName);
              if (userHasApproved || isInAllowList) {
                console.log(
                  userHasApproved
                    ? "[MCP confirm] User has approved before. No need to show confirm modal. "
                    : "[MCP confirm] Tool is in allow list. No need to show confirm modal. ",
                );
                approved = true;
              } else {
                console.log(
                  "[MCP confirm] No user approval before. Show confirm modal.  ",
                );
                const result = await showConfirm({
                  title: "Aiden " + t("dialog.mcpTitle"),
                  description: chunk.mcpInfo.tool,
                  mcpInfo: chunk.mcpInfo,
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
          } else if (Array.isArray(chunk.content)) {
            // only for image, uplpad here and update content
            const formatContent = [];
            for (const item of chunk.content) {
              if (item.type === "image_url") {
                const url = await uploadFileWithProgress(
                  item.image_url?.url ?? "",
                  (percent) => {
                    console.log("upload progress", percent);
                  },
                );
                console.log("upload image url: ", url);
                formatContent.push({
                  type: "image_url",
                  image_url: {
                    url: url,
                  },
                });
              } else {
                formatContent.push(item);
              }
            }
            options.onUpdateImage?.(formatContent);
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
