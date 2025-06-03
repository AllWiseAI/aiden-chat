"use client";
import { useDebouncedCallback } from "use-debounce";
import React, {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import StopIcon from "../icons/stop.svg";
import SendIcon from "../icons/up-arrow.svg";
import LoadingIcon from "../icons/three-dots.svg";
import SuccessIcon from "../icons/success.svg";
import ErrorIcon from "../icons/error.svg";
import ReloadIcon from "../icons/reload.svg";
import McpIcon from "../icons/mcp.svg";
import Locale from "../locales";
import { toast } from "sonner";
import { useAppUpdate } from "@/app/hooks/use-app-update";

import {
  ChatMessage,
  createMessage,
  DEFAULT_TOPIC,
  SubmitKey,
  useAppConfig,
  useChatStore,
} from "../store";

import {
  autoGrowTextArea,
  getMessageImages,
  getMessageTextContent,
  safeLocalStorage,
  useMobileScreen,
} from "../utils";

import dynamic from "next/dynamic";
import { ChatControllerPool } from "../client/controller";
import { Prompt } from "../store/prompt";
import styles from "./chat.module.scss";
import {
  CHAT_PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
} from "../constant";
import { useChatCommand } from "../command";
import { prettyObject } from "../utils/format";
import clsx from "clsx";
import { Button } from "./shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import McpTooltip from "./mcp-tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/shadcn/accordion";

const localStorage = safeLocalStorage();

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPrompt = Pick<Prompt, "title" | "content">;

function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  detach: boolean = false,
  messages: ChatMessage[],
) {
  // for auto-scroll
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollDomToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }, [scrollRef]);

  // auto scroll
  useEffect(() => {
    if (autoScroll && !detach) {
      scrollDomToBottom();
    }
  });

  // auto scroll when messages length changes
  const lastMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessagesLength.current && !detach) {
      scrollDomToBottom();
    }
    lastMessagesLength.current = messages.length;
  }, [messages.length, detach, scrollDomToBottom]);

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
  };
}

function _Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();

  const isNewChat = useMemo(() => {
    return session.messages.length === 0;
  }, [session.messages.length]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    setIsChatting(ChatControllerPool.hasPendingInSession(session.id));
  }, [session.id, session.messages]);

  const { shouldSubmit } = useSubmitHandler();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = scrollRef?.current
    ? Math.abs(
        scrollRef.current.scrollHeight -
          (scrollRef.current.scrollTop + scrollRef.current.clientHeight),
      ) <= 1
    : false;
  const isAttachWithTop = useMemo(() => {
    const lastMessage = scrollRef.current?.lastElementChild as HTMLElement;
    // if scrolllRef is not ready or no message, return false
    if (!scrollRef?.current || !lastMessage) return false;
    const topDistance =
      lastMessage!.getBoundingClientRect().top -
      scrollRef.current.getBoundingClientRect().top;
    // leave some space for user question
    return topDistance < 100;
  }, [scrollRef?.current?.scrollHeight]);

  const isTyping = userInput !== "";

  // if user is typing, should auto scroll to bottom
  // if user is not typing, should auto scroll to bottom only if already at bottom
  const { setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    (isScrolledToBottom || isAttachWithTop) && !isTyping,
    session.messages,
  );
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateTargetSession(
        session,
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    fork: () => chatStore.forkSession(),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  const onInput = (text: string) => {
    setUserInput(text);
  };

  const doSubmit = (userInput: string) => {
    if (isChatting) {
      ChatControllerPool.stopAll();
      return;
    }
    if (userInput.trim() === "") return;
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);
    chatStore.onUserInput(userInput, []).then(() => setIsLoading(false));
    chatStore.setLastInput(userInput);
    setUserInput("");
    inputRef.current?.focus();
    setAutoScroll(true);
  };

  useEffect(() => {
    chatStore.updateTargetSession(session, (session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(chatStore.lastInput ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e)) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };

  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);

  // preview messages
  const renderMessages = useMemo(() => {
    return context.concat(session.messages as RenderMessage[]).concat(
      isLoading
        ? [
            {
              ...createMessage({
                role: "assistant",
                content: "……",
              }),
              preview: true,
            },
          ]
        : [],
    );
  }, [context, isLoading, session.messages]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(key, dom?.value ?? "");
    };
  }, []);

  const renderCallRequest = (request: string | undefined) => {
    return <Markdown content={prettyObject(request || "")} />;
  };

  const renderCallResult = (result: string[] | undefined) => {
    if (!result?.length) return <LoadingIcon />;
    if (
      result.includes("declined") ||
      (Array.isArray(result) &&
        result.some((item) => item.includes("declined")))
    ) {
      return <ErrorIcon />;
    } else {
      return <SuccessIcon />;
    }
  };

  const renderMessageMcpInfo = (message: RenderMessage) => {
    if (!message.mcpInfo) return null;
    return (
      <div
        className={`${styles["chat-message-mcp-info"]} ${styles["chat-message-item-mcp"]}`}
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value={message.mcpInfo.title}
            className={styles["chat-message-mcp-item"]}
          >
            <AccordionTrigger>
              <div className="flex flex-row items-center gap-2">
                {`${message.mcpInfo.response.length ? "Called" : "Call"} ${
                  message.mcpInfo.title
                } Tool`}

                {renderCallResult(message.mcpInfo.response)}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className={styles["chat-message-item-mcp-result"]}
            >
              <div className="mb-4 rounded-2xl bg-white dark:bg-[#141718] border p-4">
                <div className="mb-2 font-medium">Request </div>
                <div>{renderCallRequest(message.mcpInfo.request)}</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-[#141718] border p-4">
                <div className="mt-2 mb-2 font-medium">Response </div>
                <div>
                  {typeof message.mcpInfo.response === "string"
                    ? message.mcpInfo.response
                    : message.mcpInfo.response.map((item, index) => (
                        <div key={index}>{item}</div>
                      ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  const { isShowUpdate, handleUpdate, isUpdating } = useAppUpdate();
  return (
    <>
      <div className={styles.chat} key={session.id}>
        <div
          className={clsx(
            "window-header",
            isNewChat ? styles["no-header"] : null,
          )}
          data-tauri-drag-region
        >
          <div
            className={clsx("window-header-title", styles["chat-body-title"])}
          >
            <div
              className={clsx(
                "window-header-main-title",
                styles["chat-body-main-title"],
              )}
            >
              {!session.topic ? DEFAULT_TOPIC : session.topic}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-tauri-drag-region="false"
                    variant="ghost"
                    onClick={() => {
                      toast(Locale.Chat.Actions.RefreshToast, {
                        className: "w-auto max-w-max",
                      });
                      chatStore.summarizeSession(true, session);
                    }}
                  >
                    <ReloadIcon />
                  </Button>
                </TooltipTrigger>

                <TooltipContent
                  hasArrow={false}
                  className="pointer-events-none bg-[#FEFEFE] text-black border"
                >
                  {Locale.Chat.Actions.RefreshTitle}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {isShowUpdate && (
            <Button
              disabled={isUpdating}
              data-tauri-drag-region="false"
              className="h-9 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] rounded-xl text-xs"
              onClick={handleUpdate}
            >
              {isUpdating ? "Updating..." : "Update Version"}
            </Button>
          )}
        </div>
        <div className={styles["chat-main"]}>
          <div className={styles["chat-body-container"]}>
            {isNewChat ? (
              <>
                <div className="w-full h-10" data-tauri-drag-region></div>
                <div className={styles["chat-main-welcome"]}>
                  Hi, I&apos;m Aiden
                </div>
              </>
            ) : (
              <div
                className={styles["chat-body"]}
                ref={scrollRef}
                onScroll={(e) => onChatBodyScroll(e.currentTarget)}
                onMouseDown={() => inputRef.current?.blur()}
                onTouchStart={() => {
                  inputRef.current?.blur();
                  setAutoScroll(false);
                }}
              >
                {messages.map((message, i) => {
                  const isUser = message.role === "user";
                  const isMcpMsg = message.mcpInfo !== undefined;

                  return (
                    <Fragment key={message.id}>
                      <div
                        className={
                          isUser
                            ? styles["chat-message-user"]
                            : styles["chat-message"]
                        }
                      >
                        <div className={styles["chat-message-container"]}>
                          <div className={styles["chat-message-item"]}>
                            {isMcpMsg && renderMessageMcpInfo(message)}
                            <Markdown
                              key={message.streaming ? "loading" : "done"}
                              content={getMessageTextContent(message)}
                              loading={
                                (message.preview || message.streaming) &&
                                message.content.length === 0 &&
                                !isUser
                              }
                              onDoubleClickCapture={() => {
                                if (!isMobileScreen) return;
                                setUserInput(getMessageTextContent(message));
                              }}
                              parentRef={scrollRef}
                              defaultShow={i >= messages.length - 6}
                            />
                            {getMessageImages(message).length == 1 && (
                              <img
                                className={styles["chat-message-item-image"]}
                                src={getMessageImages(message)[0]}
                                alt=""
                              />
                            )}
                            {getMessageImages(message).length > 1 && (
                              <div
                                className={styles["chat-message-item-images"]}
                                style={
                                  {
                                    "--image-count":
                                      getMessageImages(message).length,
                                  } as React.CSSProperties
                                }
                              >
                                {getMessageImages(message).map(
                                  (image, index) => {
                                    return (
                                      <img
                                        className={
                                          styles[
                                            "chat-message-item-image-multi"
                                          ]
                                        }
                                        key={index}
                                        src={image}
                                        alt=""
                                      />
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            )}
            <div className={styles["chat-input-panel"]}>
              <label
                className={clsx(
                  styles["chat-input-panel-inner"],
                  "overflow-hidden",
                )}
                htmlFor="chat-input"
              >
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  className={styles["chat-input"]}
                  placeholder="Ask anything..."
                  onInput={(e) => onInput(e.currentTarget.value)}
                  value={userInput}
                  onKeyDown={onInputKeyDown}
                  onFocus={scrollToBottom}
                  onClick={scrollToBottom}
                  rows={inputRows}
                  autoFocus={true}
                  style={{
                    fontSize: config.fontSize,
                    fontFamily: config.fontFamily,
                  }}
                />
                <div className="absolute bottom-8 left-8 flex gap-2">
                  <McpTooltip
                    icon={
                      <McpIcon className="size-4 text-black dark:text-white" />
                    }
                  />
                </div>
                <Button
                  className="absolute bottom-8 right-8 h-8 w-8 bg-main rounded-full hover:bg-[#00D47E]/90 p-0"
                  onClick={() => doSubmit(userInput)}
                >
                  {isChatting ? <StopIcon /> : <SendIcon />}
                </Button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Chat() {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // we should clear all the pending chat status here
      chatStore.updateTargetSession(session, (session) => {
        session.messages.forEach((m) => {
          if (m.content.length === 0) {
            m.isError = true;
            m.content = "请求已取消，请稍后重试！";
          }
        });
      });
      isFirstRender.current = false;
    }
  }, [session]);
  return <_Chat key={session.id}></_Chat>;
}
