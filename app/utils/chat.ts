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
import { useSettingStore, useAgentStore } from "@/app/store";

import { McpStepsAction, ProviderOption } from "../typing";
import { uploadFileWithProgress } from "../services/file";

type TMcpInfo = {
  id: string;
  thread_id: string;
  tool: string;
  type: string;
  result: string;
};

type TParseSSEResult = {
  isMcpInfo?: boolean;
  content?: string;
  mcpInfo?: TMcpInfo;
  rawResp?: {
    msg?: string;
    code?: number | string;
  };
  agentInfo?: {
    id: string;
    model?: string;
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
    if (extra && extra.agent_info && extra.agent_info.from_agent_id) {
      const id = extra.agent_info.from_agent_id;
      return {
        agentInfo: {
          id,
        },
      };
    } else if (
      extra &&
      extra.mcp &&
      extra.mcp.type === McpStepsAction.ToolPeek
    ) {
      console.log("tool_peek: ", extra.mcp);
      return {
        isMcpInfo: true,
        mcpInfo: extra.mcp,
        content: `\r\n${extra.mcp.name}\r\n::loading[]\r\n`,
      };
    } else if (
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

function isAllowed(toolName: string): boolean {
  return ALLOW_TOOL_LIST.some((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(toolName);
  });
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

  // 每 80ms 更新一次 UI
  const FRAME_INTERVAL = 80;
  let lastUpdate = performance.now();
  let pendingBuffer = "";

  function scheduleAnimation() {
    if (finished || controller.signal.aborted) {
      responseText += pendingBuffer + remainText;
      pendingBuffer = "";
      remainText = "";
      if (controller.signal.aborted) {
        console.log("[Response Animation] aborted");
        options.onError?.(new Error("User canceled"), true);
      }
      console.log("[Response Animation] finished");
      return;
    }

    const now = performance.now();
    if (remainText.length > 0) {
      // 动态分配取文本块
      const fetchCount = Math.max(1, Math.round(remainText.length / 80));
      const fetchText = remainText.slice(0, fetchCount);
      pendingBuffer += fetchText;
      remainText = remainText.slice(fetchCount);
    }

    if (now - lastUpdate >= FRAME_INTERVAL && pendingBuffer.length > 0) {
      // 仅在超过间隔时才更新UI
      responseText += pendingBuffer;
      pendingBuffer = "";
      lastUpdate = now;
      options.onUpdate?.(responseText);
    }

    requestAnimationFrame(scheduleAnimation);
  }

  requestAnimationFrame(scheduleAnimation);

  const finish = () => {
    if (finished) return;
    finished = true;

    // 收尾，清空缓存
    responseText += pendingBuffer + remainText;
    pendingBuffer = "";
    remainText = "";

    options.onFinish?.(responseText, responseRes);

    // 主动 hint GC
    setTimeout(() => {
      responseText = "";
    }, 1000);
  };

  controller.signal.onabort = finish;

  async function chatApi(chatPath: string, headers: any, requestPayload: any) {
    console.log("[Request] request chatApi:", chatPath);
    const chatPayload = {
      method: "POST",
      body: JSON.stringify({ ...requestPayload, stream: true }),
      signal: controller.signal,
      headers: {
        ...headers,
        Accept: "text/event-stream",
      },
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
        responseRes = res;

        const contentType = res.headers.get("content-type");
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
          if (res.status === 401) responseTexts.push(t("error.unauthorized"));
          if (extraInfo) responseTexts.push(extraInfo);
          responseText = responseTexts.join("\n\n");
          return finish();
        }
      },
      async onmessage(msg) {
        if (finished) return;
        if (msg.data === "[DONE]") {
          console.log("[Response] DONE");
          return finish();
        }

        const text = msg.data?.trim();
        if (!text) return;

        try {
          const chunk = parseSSE(text);
          if (
            (!chunk?.content || chunk.content.length === 0) &&
            !chunk.agentInfo
          ) {
            const { msg, code } = chunk.rawResp || {};
            if (msg || code) options.onError?.(chunk.rawResp, true);
            return;
          }
          if (chunk.agentInfo) {
            const { id } = chunk.agentInfo;
            const { avatar, model, name } = useAgentStore
              .getState()
              .getAgentById(id)!;
            options.onUpdate("", false, { id, avatar, model, name });
            return;
          }
          if (chunk.mcpInfo) {
            const { type } = chunk.mcpInfo;
            if (type === McpStepsAction.ToolPeek)
              options.onToolPeek?.(chunk.mcpInfo);
            if (type === McpStepsAction.ToolCallConfirm) {
              // should check if user has approved the MCP
              const userHasApproved = useSettingStore
                .getState()
                .getUserMcpApproveStatus(chunk.mcpInfo.tool);

              let approved = false;
              const toolName = chunk.mcpInfo.tool;
              const isInAllowList = isAllowed(toolName);
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
                  useSettingStore
                    .getState()
                    .setUserMcpApproveStatus(chunk.mcpInfo.tool, true);
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
              options.onUpdate?.(responseText, {
                response: chunk.mcpInfo.result,
              });
            }
          } else if (Array.isArray(chunk.content)) {
            const formatContent = [];
            for (const item of chunk.content) {
              if (item.type === "image_url") {
                const { url } = await uploadFileWithProgress(
                  item.image_url?.url ?? "",
                  (percent) => console.log("upload progress", percent),
                );
                formatContent.push({ type: "image_url", image_url: { url } });
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
        }
      },
      onclose() {
        finish();
      },
      onerror(e) {
        console.error("[Request] stream error", e);
        options?.onError?.(e, true);
        finish();
      },
      openWhenHidden: true,
    });
  }

  console.log("[ChatAPI] start");
  chatApi(chatPath, headers, requestPayload);
}
