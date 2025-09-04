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
import { isEmpty } from "lodash-es";
import LogoIcon from "../icons/aiden-logo.svg";
import DownIcon from "../icons/down.svg";
import StopIcon from "../icons/stop.svg";
import SendIcon from "../icons/up-arrow.svg";
import LoadingIcon from "../icons/three-dots.svg";
import SuccessIcon from "../icons/success.svg";
import ErrorIcon from "../icons/close.svg";
import McpIcon from "../icons/mcp.svg";
import { useTranslation } from "react-i18next";
import { FileUploader } from "./file-uploader";
import { useFileUploadStore } from "@/app/store/file-upload";
import CircleProgress from "./circle-progress";
import { relaunch } from "@tauri-apps/api/process";
import {
  ChatMessage,
  createMessage,
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
import styles from "./chat.module.scss";
import {
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
  DEFAULT_USER_DELINETED,
} from "../constant";
import { useChatCommand } from "../command";
import { prettyObject } from "../utils/format";
import clsx from "clsx";
import { Button } from "./shadcn/button";
import { track, EVENTS } from "@/app/utils/analysis";

import McpPopover from "./mcp-tooltip";
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

function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  detach: boolean = false,
  messages: ChatMessage[],
) {
  // for auto-scroll
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollDomToBottom = useCallback(
    (smooth?: boolean) => {
      const dom = scrollRef.current;
      if (dom) {
        requestAnimationFrame(() => {
          setAutoScroll(true);
          dom.scrollTo({
            top: dom.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
          });
        });
      }
    },
    [scrollRef],
  );

  // auto scroll
  useEffect(() => {
    if (autoScroll && detach) {
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

function InnerChat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();

  const files = useFileUploadStore((state) => state.files);

  const removeFile = useFileUploadStore((state) => state.removeFile);

  const isNewChat = useMemo(() => {
    return session.messages.length === 0;
  }, [session.messages.length]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const { t } = useTranslation("general");
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
    if (!isScrolledToBottom) return false;
    const lastMessage = scrollRef.current?.lastElementChild as HTMLElement;
    // if scrolllRef is not ready or no message, return false
    if (!scrollRef?.current || !lastMessage) return false;
    const topDistance =
      lastMessage!.getBoundingClientRect().top -
      scrollRef.current.getBoundingClientRect().top;
    // leave some space for user question
    return topDistance < 100;
  }, [scrollRef?.current?.scrollHeight, isScrolledToBottom]);

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
  // id 切换时要重新判断滚动行为
  useEffect(() => {
    setAutoScroll(false);
    scrollToBottom();
  }, [session.id]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () => chatStore.clearSessions(),
    fork: () => chatStore.forkSession(),
    debug: () => {
      config.switchDebugMode();
      setTimeout(async () => {
        await relaunch();
      }, 1000);
    },
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  const onInput = (text: string) => {
    setUserInput(text);
  };
  const doSubmit = (userInput: string) => {
    if (isChatting) {
      const sessionId = session.id;
      const messageId = session.messages[session.messages.length - 1].id;
      ChatControllerPool.stop(sessionId, messageId);
      return;
    }
    if (userInput.trim() === "" && isEmpty(files)) return;

    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);
    chatStore.onUserInput(userInput, files).then(() => setIsLoading(false));
    chatStore.setLastInput(userInput);
    setUserInput("");
    files.forEach((file) => removeFile(file.id));
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
    if (shouldSubmit(e) && !isChatting) {
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

  // const [msgRenderIndex, _setMsgRenderIndex] = useState(
  //   Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  // );

  // function setMsgRenderIndex(newIndex: number) {
  //   newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
  //   newIndex = Math.max(0, newIndex);
  //   _setMsgRenderIndex(newIndex);
  // }

  // const messages = useMemo(() => {
  //   const endRenderIndex = Math.min(
  //     msgRenderIndex + 3 * CHAT_PAGE_SIZE,
  //     renderMessages.length,
  //   );
  //   return renderMessages.slice(msgRenderIndex, endRenderIndex);
  // }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    // const edgeThreshold = e.clientHeight;

    // const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    // const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    // const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    // const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    // if (isTouchTopEdge && !isTouchBottomEdge) {
    //   setMsgRenderIndex(prevPageMsgIndex);
    // } else if (isTouchBottomEdge) {
    //   setMsgRenderIndex(nextPageMsgIndex);
    // }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };

  function scrollToBottom(smooth: boolean = false) {
    // setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom(smooth);
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

  const renderMcpToolResponse = (response: string[] | undefined) => {
    if (!response?.length) return null;
    return typeof response === "string"
      ? response
      : response.map((item, index) => (
          <div key={index} className="max-h-100 overflow-y-auto">
            {item}
          </div>
        ));
  };

  const renderCallResult = (result: string[] | undefined) => {
    if (!result?.length) return <LoadingIcon />;
    if (result.includes(DEFAULT_USER_DELINETED)) {
      return <ErrorIcon className="size-5 text-[#EF466F]" />;
    } else if (
      result.includes("code: -1") ||
      (Array.isArray(result) &&
        result.some((item) => item.includes("code: -1")))
    ) {
      return <ErrorIcon className="size-5 text-[#EF466F]" />;
    } else {
      return <SuccessIcon className="size-5 text-main" />;
    }
  };

  const renderErrorMsg = (message: RenderMessage) => {
    if (!message.isError) return null;
    return (
      <div className={`${styles["chat-message-item-error"]}`}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value={message.content as string}
            className={styles["chat-message-mcp-item"]}
          >
            <AccordionTrigger className="!py-0">
              <div className="flex flex-row items-center gap-2">
                {message.content as string}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className={styles["chat-message-item-mcp-result"]}
            >
              <Markdown content={message.errorInfo ?? ""} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
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
            <AccordionTrigger className="!py-0">
              <div className="flex flex-row items-center gap-2">
                {`${
                  message.mcpInfo.response?.length
                    ? t("chat.mcp.called")
                    : t("chat.mcp.call")
                } ${message.mcpInfo.title} ${t("chat.mcp.tool")}`}

                {renderCallResult(message.mcpInfo.response)}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className={styles["chat-message-item-mcp-result"]}
            >
              <div className="mb-2.5 rounded-sm bg-white dark:bg-[#141718] border p-2.5">
                <div className="mb-2 font-medium">Request</div>
                <div>{renderCallRequest(message.mcpInfo.request)}</div>
              </div>
              <div className="rounded-sm bg-white dark:bg-[#141718] border p-2.5">
                <div className="mb-2 font-medium">Response</div>
                <div>{renderMcpToolResponse(message.mcpInfo.response)}</div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  const shouldDisabled = useMemo(() => {
    const haveFiles = files.filter((file) => file.url !== "").length;
    return !(userInput.length || haveFiles) && !isChatting;
  }, [userInput, files, isChatting]);

  return (
    <>
      <div
        className={clsx(
          styles.chat,
          "border-t border-[#E8ECEF] dark:border-[#232627]/50",
        )}
        key={session.id}
      >
        <div className={styles["chat-main"]}>
          <div className={styles["chat-body-container"]}>
            {isNewChat ? (
              <>
                <div
                  className={clsx(
                    styles["chat-main-welcome"],
                    "flex gap-2.5 text-4xl",
                  )}
                >
                  <LogoIcon className="size-10" />
                  {t("chat.title")} Aiden
                </div>
              </>
            ) : (
              <div
                className={clsx(styles["chat-body"], "scroll-container")}
                ref={scrollRef}
                onScroll={(e) => onChatBodyScroll(e.currentTarget)}
                onMouseDown={() => inputRef.current?.blur()}
                onTouchStart={() => {
                  inputRef.current?.blur();
                  setAutoScroll(false);
                }}
              >
                <div className="flex flex-col gap-5 w-full h-max max-w-[776px]">
                  {renderMessages.map((message, i) => {
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
                            <div
                              className={clsx(
                                styles["chat-message-item"],
                                message.role === "user" && "p-3",
                              )}
                            >
                              {isMcpMsg && renderMessageMcpInfo(message)}
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
                              {message.isError ? (
                                renderErrorMsg(message)
                              ) : (
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
                                    setUserInput(
                                      getMessageTextContent(message),
                                    );
                                  }}
                                  parentRef={scrollRef}
                                  defaultShow={i >= renderMessages.length - 6}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="px-15">
              <div className={styles["chat-input-panel"]}>
                {!hitBottom && (
                  <Button
                    variant="ghost"
                    className="absolute -top-10 right-2 size-8 z-1 border bg-white dark:bg-[#343839] rounded-full"
                    onClick={() => scrollToBottom(true)}
                  >
                    <DownIcon className="text-black dark:text-white size-4" />
                  </Button>
                )}
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
                    className={clsx(
                      styles["chat-input"],
                      {
                        [styles["chat-input-with-image"]]: files.length > 0,
                      },
                      "placeholder:text-[#6C7275]",
                    )}
                    placeholder={t("chat.placeholder")}
                    onInput={(e) => onInput(e.currentTarget.value)}
                    value={userInput}
                    onKeyDown={onInputKeyDown}
                    rows={inputRows}
                    autoFocus={true}
                    style={{
                      fontSize: config.fontSize,
                      fontFamily: config.fontFamily,
                    }}
                  />
                  <div
                    className={clsx(
                      "absolute top-[1px] left-3 pt-3 flex items-center gap-2.5 w-[calc(100%-24px)] bg-white dark:bg-[#141416]",
                      files.length > 0 && "pb-2",
                    )}
                  >
                    {files.map((img) => (
                      <div key={img.id} className="relative">
                        {img.url ? (
                          <img
                            src={img.url}
                            className={styles["input-img"]}
                          ></img>
                        ) : (
                          <div className={styles["input-img-loading"]}>
                            <CircleProgress progress={img.progress} />
                          </div>
                        )}
                        <Button
                          onClick={() => removeFile(img.id)}
                          className="absolute -top-2 -right-2 bg-[#F3F5F7] text-[#343839] rounded-full w-4 h-4 flex-center p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <FileUploader />
                    <McpPopover
                      icon={
                        <McpIcon className="size-[18px] text-black dark:text-white stroke-[1.125]" />
                      }
                    />
                  </div>
                  <Button
                    className="absolute bottom-3 right-3 size-8 bg-main rounded-full hover:bg-[#00D47E]/90 p-0 disabled:bg-[#6C7275] disabled:opacity-100 dark:disabled:bg-[#343839] !disabled:cursor-not-allowed"
                    onClick={() => doSubmit(userInput)}
                    disabled={shouldDisabled}
                  >
                    {isChatting ? (
                      <StopIcon className="size-6 text-white dark:text-black" />
                    ) : (
                      <SendIcon className="size-6 text-white dark:text-black" />
                    )}
                  </Button>
                </label>
              </div>
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

  useEffect(() => {
    track(EVENTS.HOME_EXPOSURE);
  }, []);

  return <InnerChat key={session.id}></InnerChat>;
}
