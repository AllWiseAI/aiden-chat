import React, {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";

import styles from "./home.module.scss";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/shadcn/avatar";

import { Button } from "@/app/components/shadcn/button";
import { Input } from "@/app/components/shadcn/input";
import LogoIcon from "../icons/logo-invite.svg";
import LogoTextIcon from "../icons/logo-text.svg";
import SearchIcon from "../icons/search.svg";
import CollapseIcon from "../icons/collapse.svg";
import AddIcon from "../icons/add.svg";
import ChatIcon from "../icons/chat.svg";
import TaskIcon from "../icons/task.svg";
import { useTranslation } from "react-i18next";
import {
  useAppConfig,
  useAuthStore,
  useChatStore,
  useTaskStore,
} from "../store";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import { useNavigate, useLocation } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { InviteDialog } from "./invite-dialog";
// import { exportAndDownloadLog } from "../utils/log";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

const TaskList = dynamic(async () => (await import("./task-list")).TaskList, {
  loading: () => null,
});

export function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

export function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    document.body.classList.add("select-none");
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      document.body.classList.remove("select-none");
      document.removeEventListener("selectstart", (e) => e.preventDefault);
      document.body.style.userSelect = "";

      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
    toggleSideBar,
  };
}

export function SideBarContainer(props: {
  children: React.ReactNode;
  onDragStart: (e: MouseEvent) => void;
  shouldNarrow: boolean;
  className?: string;
}) {
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  const { children, className, onDragStart, shouldNarrow } = props;
  return (
    <div
      className={clsx(
        styles.sidebar,
        className,
        {
          [styles["narrow-sidebar"]]: shouldNarrow,
        },
        "bg-[#F3F5F7]/50 dark:bg-[#101010]",
      )}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {children}
      <div
        className="absolute w-[2px] h-full top-0 right-0 transition-all ease-in-out duration-300 dark:bg-[#23262F] hover:bg-[#00D47E] dark:hover:bg-[#00D47E] cursor-ew-resize"
        onPointerDown={(e) => onDragStart(e as any)}
      ></div>
    </div>
  );
}

export function SideBarHeader(props: {
  children?: React.ReactNode;
  shouldNarrow?: boolean;
  toggleSearch: () => void;
}) {
  const { children, shouldNarrow, toggleSearch } = props;

  const { toggleSideBar } = useDragSideBar();
  const debugMode = useAppConfig().debugMode;

  return (
    <Fragment>
      <div
        className={clsx(
          "flex items-center h-20 gap-4 overflow-hidden px-4 pt-8 dark:border-[#232627] select-none",
          shouldNarrow ? "justify-center" : "justify-between",
        )}
      >
        {!shouldNarrow && (
          <>
            {debugMode ? "AidenDebug" : <LogoTextIcon className="h-[23px]" />}
          </>
        )}
        <div className="flex gap-1.5">
          {!shouldNarrow && (
            <Button variant="ghost" className="size-6" onClick={toggleSearch}>
              <SearchIcon className="size-5" />
            </Button>
          )}
          <Button variant="ghost" className="size-6" onClick={toggleSideBar}>
            <CollapseIcon className="size-5" />
          </Button>
        </div>
      </div>
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  tabValue: string;
  setTabValue: Dispatch<SetStateAction<"task" | "chat">>;
  isSearchVisible: boolean;
  shouldNarrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const {
    children,
    shouldNarrow = false,
    searchValue,
    setSearchValue,
    tabValue,
    setTabValue,
    isSearchVisible,
  } = props;
  const navigate = useNavigate();
  const currentTaskId = useTaskStore((state) => state.currentTaskId);

  return (
    <>
      {isSearchVisible && !shouldNarrow && (
        <div className="mt-2.5 px-4 pb-2.5">
          <div className="flex-center relative">
            <Input
              className="h-9 !text-left focus:border-[#00D47E] focus:dark:border-[#00D47E] placeholder:text-sm !placeholder:text-[#6C7275] pl-6 pr-2.5 py-1 rounded-sm"
              clearable
              value={searchValue}
              placeholder="Search"
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <SearchIcon className="absolute top-1/2 left-1.5 transform -translate-y-1/2 size-4 text-[#6C7275]/50" />
          </div>
        </div>
      )}
      <div className="mt-2.5 flex-1 flex flex-col min-h-0">
        <div className="flex justify-center h-full">
          <div className="flex flex-col gap-3 w-16 border-r border-white dark:border-[#242424]">
            <div
              className={clsx(
                "flex-center flex-col cursor-pointer",
                tabValue === "chat"
                  ? "text-main"
                  : "text-[#232627]/50 dark:text-[#E8ECEF]/50 hover:opacity-80",
              )}
              onClick={() => {
                setTabValue("chat");
                navigate(Path.Chat);
              }}
            >
              <div className="rounded-full size-10 flex-center bg-white dark:bg-[#262626]">
                <ChatIcon />
              </div>
              <span className="text-xs">Chats</span>
            </div>
            <div
              className={clsx(
                "flex-center flex-col cursor-pointer",
                tabValue === "task"
                  ? "text-main"
                  : "text-[#232627]/50 dark:text-[#E8ECEF]/50 hover:opacity-80",
              )}
              onClick={() => {
                setTabValue("task");
                navigate(`${Path.Task}/${currentTaskId}`);
              }}
            >
              <div className="rounded-full size-10 flex-center bg-white dark:bg-[#262626]">
                <TaskIcon />
              </div>
              <span className="text-xs">Tasks</span>
            </div>
          </div>
          {!shouldNarrow && (
            <div className="flex-1 flex flex-col gap-2.5 px-4 overflow-y-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function SideBarFooter(props: {
  children?: React.ReactNode;
  shouldNarrow?: boolean;
}) {
  const { children, shouldNarrow } = props;
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInvite, setShowInvite] = useState(false);
  // const { t } = useTranslation("settings");
  // const [showItem, setShowItem] = useState(false);
  // const logout = async () => {
  //   navigate(Path.Login);
  //   try {
  //     const success = await authStore.logout();
  //     if (success) {
  //       toast.success("Logout success", {
  //         className: "w-auto max-w-max",
  //       });
  //     }
  //   } catch (e: any) {
  //     toast.error(e.message, {
  //       className: "w-auto max-w-max",
  //     });
  //   }
  // };

  return (
    <div className="flex gap-2.5 mb-4">
      {children}

      <div
        className={clsx(
          "flex-center flex-col gap-2.5 border-r border-white dark:border-[#242424] overflow-hidden",
          shouldNarrow ? "w-full" : "w-16",
        )}
      >
        <Avatar
          className="size-10 cursor-pointer"
          onClick={() => {
            if (location.pathname !== Path.Settings) {
              navigate(Path.Settings);
            }
          }}
        >
          <AvatarImage src={authStore.user.profile} />
          <AvatarFallback>
            {authStore.user.email?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* <div
          className={clsx(
            "transition-all duration-300 ease-in-out",
            showItem ? " max-h-40" : "max-h-0",
          )}
        >
          <div
            className={clsx(
              "flex items-center gap-2 !px-1.5 !py-2 w-full hover:bg-[#E8ECEF]/50 dark:hover:bg-[#232627]/50 cursor-pointer",
              !shouldNarrow ? "justify-start" : "justify-center",
            )}
            onClick={() => {
              if (location.pathname !== Path.Settings) {
                navigate(Path.Settings);
              }
            }}
          >
            <SettingIcon className="size-[18px]" />
            {!shouldNarrow && (
              <span className="-ml-1 text-xs">{t("title")}</span>
            )}
          </div>
          <div
            className={clsx(
              "flex items-center gap-2 !px-1.5 !py-2 w-full hover:bg-[#E8ECEF]/50 dark:hover:bg-[#232627]/50 cursor-pointer",
              !shouldNarrow ? "justify-start" : "justify-center",
            )}
            onClick={logout}
          >
            <LogoutIcon className="size-[18px]" />
            {!shouldNarrow && (
              <span className="-ml-1 text-xs">{t("general.logout")}</span>
            )}
          </div>
        </div> */}
      </div>

      {!shouldNarrow && (
        <div className="flex justify-state flex-1 h-10">
          <Button
            onClick={() => setShowInvite(true)}
            className="flex-center h-full py-0 text-[13px] font-normal bg-[#333333] dark:bg-black border dark:border-[#00D47E] hover:bg-[#333333]/85 text-[#00D47E] rounded-full"
          >
            <LogoIcon className="size-5 mb-1" />
            <span>Invite friends</span>
          </Button>
        </div>
      )}
      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const { t } = useTranslation("general");
  const [searchValue, setSearchValue] = useState("");
  const [tabValue, setTabValue] = useState<"chat" | "task">("chat");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const pathName = location.pathname;
    if (pathName.includes(Path.Chat)) {
      setTabValue("chat");
    } else if (pathName.includes(Path.Task)) {
      setTabValue("task");
    }
  }, [location]);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <SideBarContainer
      onDragStart={onDragStart}
      className="flex flex-col h-full"
      shouldNarrow={shouldNarrow}
      {...props}
    >
      <SideBarHeader
        shouldNarrow={shouldNarrow}
        toggleSearch={toggleSearch}
      ></SideBarHeader>
      <SideBarBody
        shouldNarrow={shouldNarrow}
        tabValue={tabValue}
        setTabValue={setTabValue}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        isSearchVisible={isSearchVisible}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Chat);
          }
        }}
      >
        {!shouldNarrow && (
          <>
            <div className="flex flex-col gap-2 sticky top-0 bg-[#F9FAFB] dark:bg-[#141416]">
              <Button
                variant="ghost"
                className="h-9 text-main flex justify-start items-center gap-1 !px-1.5 py-1.5 rounded-sm"
                onClick={() => {
                  if (tabValue === "chat") {
                    chatStore.newSession();
                    navigate(Path.Chat);
                  } else if (tabValue === "task") {
                    navigate(Path.NewTask);
                  }
                }}
              >
                <AddIcon className="size-5 text-main" />
                <span className="text-main font-medium select-none">
                  {tabValue === "chat" ? t("home.newChat") : t("home.newTask")}
                </span>
              </Button>
            </div>
          </>
        )}
        {tabValue === "chat" && (
          <ChatList narrow={shouldNarrow} searchValue={searchValue} />
        )}
        {tabValue === "task" && <TaskList searchValue={searchValue} />}
      </SideBarBody>
      <SideBarFooter shouldNarrow={shouldNarrow} />
    </SideBarContainer>
  );
}
