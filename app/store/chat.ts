import { getMessageTextContent, safeLocalStorage, trimTopic } from "../utils";
import { UploadedFile } from "@/app/store/file-upload";
import { DEFAULT_USER_DELINETED } from "../constant";
import { prettyObject } from "@/app/utils/format";
import { indexedDBStorage } from "@/app/utils/indexedDB-storage";
import { nanoid } from "nanoid";
import type {
  ClientApi,
  MultimodalContent,
  RequestMessage,
  ToolCallInfo,
} from "../client/api";
import { getClientApi } from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { DEFAULT_INPUT_TEMPLATE, StoreKey } from "../constant";
import { getLang } from "../locales";
import { t } from "i18next";
import { createPersistStore } from "../utils/store";
import { estimateTokenLength } from "../utils/token";
import { ModelConfig, useAppConfig } from "./config";
import { createEmptyMask, Mask } from "./mask";
import { taskSessionParams, ProviderOption } from "@/app/typing";

const localStorage = safeLocalStorage();

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  content?: string;
  isError?: boolean;
  errorMsg?: string;
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: string;
  tools?: ChatMessageTool[];
  audio_url?: string;
  isMcpResponse?: boolean;
  errorInfo?: string;
  content: string | MultimodalContent[];
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
  modelInfo: ProviderOption;
}

export const defaultTopic = () => t("store.defaultTopic");
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: t("store.botHello"),
});

function createEmptySession(id?: string): ChatSession {
  const config = useAppConfig.getState();
  const modelInfo = config.getDefaultModel();
  return {
    id: id ? id : nanoid(),
    topic: "",
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
    modelInfo: modelInfo,
  };
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const vars = {
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
  lastInput: "",
};

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      forkSession() {
        // 获取当前会话
        const currentSession = get().currentSession();
        if (!currentSession) return;

        const newSession = createEmptySession();

        newSession.topic = currentSession.topic;
        // 深拷贝消息
        newSession.messages = currentSession.messages.map((msg) => ({
          ...msg,
          id: nanoid(), // 生成新的消息 ID
        }));
        newSession.mask = {
          ...currentSession.mask,
          modelConfig: {
            ...currentSession.mask.modelConfig,
          },
        };

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [newSession, ...state.sessions],
        }));
      },

      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },
      haveTaskSession(task_id: string) {
        const { sessions } = get();
        return sessions.some((session) => session.id === task_id);
      },
      selectTaskSession(task_id: string) {
        const { sessions, selectSession } = get();
        const index = sessions.findIndex((session) => session.id === task_id);
        selectSession(index);
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(mask?: Mask, modelInfo?: ProviderOption) {
        const session = createEmptySession();
        if (mask) {
          const config = useAppConfig.getState();
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...mask.modelConfig,
            },
          };
          session.topic = mask.name;
        }

        if (modelInfo) {
          session.modelInfo = modelInfo;
        }

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },
      newTaskSession({
        taskId,
        modelInfo,
        requestData,
        responseData,
      }: taskSessionParams) {
        const session = createEmptySession(taskId);
        session.modelInfo = modelInfo;
        session.messages = [
          ...requestData.map((msg: any) => ({
            ...msg,
            date: msg.date || new Date().toLocaleString(),
            id: msg.id || nanoid(),
          })),
          ...responseData.map((msg: any) => ({
            ...msg,
          })),
        ];
        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
        get().summarizeSession(true, session);
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = 0;
          sessions.push(createEmptySession());
        }

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        get().updateTargetSession(targetSession, (session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });

        get().updateStat(message, targetSession);
        get().summarizeSession(false, targetSession);
      },

      async onUserInput(
        content: string,
        attachFiles?: UploadedFile[],
        isMcpResponse?: boolean,
      ) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        // MCP Response no need to fill template
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, modelConfig);

        if (!isMcpResponse && attachFiles && attachFiles.length > 0) {
          // @ts-ignore
          mContent = [
            ...(content ? [{ type: "text" as const, text: content }] : []),
            ...attachFiles
              .map((fileItem) => {
                const {
                  file: { type },
                  url,
                } = fileItem;
                if (type === "application/pdf") {
                  return {
                    type: "file_url",
                    file_url: { url },
                  };
                }
                if (type.startsWith("image/")) {
                  return {
                    type: "image_url" as const,
                    image_url: { url },
                  };
                }

                return undefined;
              })
              .filter((item) => item !== undefined),
          ];
        }

        const userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
        });

        // get recent messages
        const recentMessages = await get().getMessagesWithMemory();
        const sendMessages = recentMessages
          .concat(userMessage)
          .filter((message) => message.content !== "");
        const messageIndex = session.messages.length + 1;

        // save user's and bot's message
        get().updateTargetSession(session, (session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });
        const api: ClientApi = getClientApi();
        // make request
        api.llm.chat({
          chatId: session.id,
          modelInfo: session.modelInfo,
          messages: sendMessages,
          config: { ...modelConfig, stream: true },
          onToolCall: (toolCallInfo) => {
            get().onToolCall(toolCallInfo, session);
          },
          onUpdate(message, mcpInfo) {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            if (mcpInfo) {
              botMessage.isMcpResponse = true;
              if (!botMessage.mcpInfo) {
                botMessage.mcpInfo = {
                  title: mcpInfo.title ?? "",
                  request: mcpInfo.request ?? "",
                  response: mcpInfo.response ? [mcpInfo.response] : [],
                };
              } else {
                if (mcpInfo.title) {
                  botMessage.mcpInfo.title = mcpInfo.title;
                }
                if (mcpInfo.request) {
                  botMessage.mcpInfo.request = mcpInfo.request;
                }
                if (mcpInfo.response) {
                  botMessage.mcpInfo.response.push(mcpInfo.response);
                }
              }
            }
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          async onFinish(message, _, mcpInfo) {
            botMessage.streaming = false;
            if (mcpInfo) {
              botMessage.isMcpResponse = true;
              if (!botMessage.mcpInfo) {
                botMessage.mcpInfo = {
                  title: mcpInfo.title ?? "",
                  request: mcpInfo.request ?? "",
                  response: mcpInfo.response ? [mcpInfo.response] : [],
                };
              } else {
                if (mcpInfo.title) {
                  botMessage.mcpInfo.title = mcpInfo.title;
                }
                if (mcpInfo.request) {
                  botMessage.mcpInfo.request = mcpInfo.request;
                }
                if (mcpInfo.response) {
                  botMessage.mcpInfo.response.push(mcpInfo.response);
                }
              }
              get().onNewMessage(botMessage, session);
            }
            if (message) {
              botMessage.content = message;
              botMessage.date = new Date().toLocaleString();
              get().onNewMessage(botMessage, session);
            }
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onBeforeTool(tool: ChatMessageTool) {
            (botMessage.tools = botMessage?.tools || []).push(tool);
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                tools[i] = { ...tool };
              }
            });
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onError(error: Error & { msg: string }, shouldStream: boolean) {
            const isAborted = error.message?.includes?.("canceled");
            const isTimeout = error.message?.includes?.("timeout");
            if (isTimeout) {
              botMessage.content += t("error.timeoutErr");
              botMessage.errorInfo =
                "\n\n" +
                prettyObject({
                  msg: t("error.timeoutErr"),
                  code: -1,
                });
            } else if (!isAborted) {
              botMessage.content += error.msg;
              botMessage.errorInfo =
                "\n\n" +
                prettyObject({
                  ...error,
                });
            }
            botMessage.streaming = false;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateTargetSession(session, (session) => {
              if (
                isAborted &&
                !isTimeout &&
                (!shouldStream ||
                  (shouldStream && botMessage.content.length === 0))
              ) {
                session.messages = session.messages.concat().slice(0, -1);
              } else {
                session.messages = session.messages.concat();
              }
            });
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error?.message);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      onToolCall(toolCallInfo: ToolCallInfo, currentSession?: ChatSession) {
        const session = currentSession ?? get().currentSession();
        console.log("session in toolcall===", session);
        if (!session) return;
        const modelConfig = session.mask.modelConfig;
        const messageIndex = session.messages.length + 1;

        const mcpInfo = {
          title: toolCallInfo.title ?? "",
          request: toolCallInfo.request ?? "",
          response: [] as string[],
        };

        const { approved } = toolCallInfo;
        if (!approved) {
          mcpInfo.response = [DEFAULT_USER_DELINETED];
        }

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          mcpInfo: mcpInfo,
        });

        get().updateTargetSession(session, (session) => {
          session.messages = session.messages.concat([botMessage]);
        });
        const api: ClientApi = getClientApi();
        api.llm.toolCall({
          toolCallInfo,
          chatId: session.id,
          modelInfo: session.modelInfo,
          config: { ...modelConfig, stream: true },
          onUpdate(message, mcpInfo) {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            if (mcpInfo) {
              botMessage.isMcpResponse = true;
              if (botMessage.mcpInfo) {
                botMessage.mcpInfo.response.push(mcpInfo.response ?? "");
              }
            }
            get().updateTargetSession(session, (session: ChatSession) => {
              session.messages = session.messages.concat();
            });
          },
          onToolCall(toolCallInfo) {
            get().onToolCall(toolCallInfo, session);
          },
          async onFinish(message, _, mcpInfo) {
            botMessage.streaming = false;
            if (mcpInfo) {
              botMessage.isMcpResponse = true;
              if (mcpInfo.response) {
                if (botMessage.mcpInfo) {
                  botMessage.mcpInfo.response.push(mcpInfo.response);
                }
              }
              get().onNewMessage(botMessage, session);
            }
            if (message) {
              botMessage.content = message;
              botMessage.date = new Date().toLocaleString();
              get().onNewMessage(botMessage, session);
            }
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onBeforeTool(tool: ChatMessageTool) {
            (botMessage.tools = botMessage?.tools || []).push(tool);
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                tools[i] = { ...tool };
              }
            });
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onError(error, shouldStream: boolean) {
            const isAborted = error.message?.includes?.("canceled");
            const isTimeout = error.message?.includes?.("timeout");
            if (isTimeout) {
              botMessage.content += t("error.timeoutErr");
              botMessage.errorInfo =
                "\n\n" +
                prettyObject({
                  msg: t("error.timeoutErr"),
                  code: -1,
                });
            } else if (!isAborted) {
              botMessage.content += error.msg;
              botMessage.errorInfo =
                "\n\n" +
                prettyObject({
                  ...error,
                });
            }
            botMessage.streaming = false;
            botMessage.isError = !isAborted;
            get().updateTargetSession(session, (session) => {
              if (
                isAborted &&
                !isTimeout &&
                (!shouldStream ||
                  (shouldStream && botMessage.content.length === 0))
              ) {
                session.messages = session.messages.concat().slice(0, -1);
              } else {
                session.messages = session.messages.concat();
              }
            });
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error?.message);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        if (session.memoryPrompt.length) {
          return {
            role: "system",
            content: t("store.prompt.history", {
              content: session.memoryPrompt,
            }),
            date: "",
          } as ChatMessage;
        }
      },

      async getMessagesWithMemory() {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();
        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        const memoryStartIndex = shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(getMessageTextContent(msg));
          reversedRecentMessages.push(msg);
        }
        // concat all messages
        const recentMessages = [
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession(session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession(
        refreshTitle: boolean = false,
        targetSession: ChatSession,
      ) {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;
        const api: ClientApi = getClientApi();
        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 10 words
        const SUMMARIZE_MIN_LEN = 10;
        if (
          (config.enableAutoGenerateTitle &&
            session.topic === "" &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                content: t("store.prompt.topic"),
              }),
            );
          api.llm.chat({
            chatId: session.id,
            isSummary: true,
            messages: topicMessages,
            config: { stream: false },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200 && !message?.includes("Error")) {
                get().updateTargetSession(
                  session,
                  (session) =>
                    (session.topic =
                      message.length > 0 ? trimTopic(message) : defaultTopic()),
                );
              }
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > (modelConfig?.max_tokens || 4000)) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        if (memoryPrompt) {
          // add memory prompt
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          api.llm.chat({
            chatId: session.id,
            isSummary: true,
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: t("store.prompt.summarize"),
                date: "",
              }),
            ),
            config: {
              stream: false,
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(session, (session) => {
                  session.lastSummarizeIndex = lastSummarizeIndex;
                  session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
                });
              }
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }
      },

      updateStat(message: ChatMessage, session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },
      updateTargetSession(
        targetSession: ChatSession,
        updater: (session: ChatSession) => void,
      ) {
        const sessions = get().sessions;
        const newSession = [...sessions];
        const index = newSession.findIndex((s) => s.id === targetSession.id);
        if (index < 0) return;
        updater(newSession[index]);
        set(() => ({ sessions: [...newSession] }));
      },

      async clearAllData() {
        await indexedDBStorage.clear();
        localStorage.clear();
        location.reload();
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },
    };

    return methods;
  },
  {
    name: StoreKey.Chat,
    version: 2.2,
  },
);
