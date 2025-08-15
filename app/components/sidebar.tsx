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

import { Button } from "@/app/components/shadcn/button";
import { Input } from "@/app/components/shadcn/input";
import SearchIcon from "../icons/search.svg";
import CollapseIcon from "../icons/collapse.svg";
import PlusIcon from "../icons/plus.svg";
import { useTranslation } from "react-i18next";
import { useAppConfig, useChatStore } from "../store";
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
        "bg-[#F3F5F7] dark:bg-[#232627]/50",
      )}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {children}
      <div
        className="absolute w-[2px] h-full top-0 right-0 transition-all ease-in-out duration-300 bg-[#E8ECEF] dark:bg-[#232627]/50 hover:bg-[#00D47E] dark:hover:bg-[#00D47E] cursor-ew-resize"
        onPointerDown={(e) => onDragStart(e as any)}
      ></div>
    </div>
  );
}

export function SideBarHeader(props: {
  children?: React.ReactNode;
  shouldNarrow?: boolean;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
}) {
  const { children, shouldNarrow, searchValue, setSearchValue } = props;
  const { toggleSideBar } = useDragSideBar();

  return (
    <Fragment>
      {!shouldNarrow && (
        <div
          className={clsx(
            "flex items-center h-15 gap-4 overflow-hidden p-4 dark:border-[#232627] select-none",
          )}
          data-tauri-drag-region
        >
          <div className="flex gap-1.5">
            <div className="flex-center relative">
              <Input
                className="h-[30px] !text-left bg-[#E8ECEF] dark:bg-[#232627] focus:bg-white dark:focus:bg-[#101213] focus:border-[#00D47E] focus:dark:border-[#00D47E] placeholder:text-sm !placeholder:text-[#6C7275] pl-6 pr-2.5 py-1 rounded-sm"
                clearable
                value={searchValue}
                placeholder="Search"
                onChange={(e) => setSearchValue(e.target.value)}
              />

              <SearchIcon className="absolute top-1/2 left-1.5 transform -translate-y-1/2 size-4 text-[#6C7275]/50" />
            </div>
            <Button
              variant="ghost"
              className="bg-[#E8ECEF] dark:bg-[#232627] size-[30px]"
              onClick={toggleSideBar}
            >
              <CollapseIcon className="size-5" />
            </Button>
          </div>
        </div>
      )}
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  tabValue: string;
  setTabValue: Dispatch<SetStateAction<"task" | "chat">>;
  shouldNarrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const { shouldNarrow = false, children, tabValue } = props;

  const { t } = useTranslation("general");
  const chatStore = useChatStore();
  const navigate = useNavigate();

  return (
    <>
      {!shouldNarrow && (
        <>
          <div className="px-4 pb-4">
            <Button
              variant="ghost"
              className="w-full h-9.5 bg-[#00AB66]/6 hover:bg-[#00AB66]/12 dark:hover:bg-[#00AB66]/12 border border-[#00AB66]/15 text-main flex justify-start items-center gap-2 !px-1.5 py-1.5 rounded-lg"
              onClick={() => {
                if (tabValue === "chat") {
                  chatStore.newSession();
                  navigate(Path.Chat);
                } else if (tabValue === "task") {
                  navigate(Path.NewTask);
                }
              }}
            >
              <PlusIcon className="size-4 text-main" />
              <span className="text-main font-medium text-sm select-none">
                {tabValue === "chat" ? t("home.newChat") : t("home.newTask")}
              </span>
            </Button>
          </div>
          <div className="flex-1 flex flex-col gap-2.5 px-4 overflow-y-auto">
            {children}
          </div>
        </>
      )}
    </>
  );
}

export function SideBarFooter(props: {
  children?: React.ReactNode;
  shouldNarrow?: boolean;
}) {
  const { children, shouldNarrow } = props;

  return (
    <div className="flex gap-2.5 my-4">
      {children}

      <div
        className={clsx(
          "flex-center flex-col gap-2.5 border-r border-white dark:border-[#242424] overflow-hidden",
          shouldNarrow ? "w-full" : "w-16",
        )}
      ></div>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const [searchValue, setSearchValue] = useState("");
  const [tabValue, setTabValue] = useState<"chat" | "task">("chat");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathName = location.pathname;
    if (pathName.includes(Path.Chat)) {
      setTabValue("chat");
    } else if (pathName.includes(Path.Task)) {
      setTabValue("task");
    }
  }, [location]);

  return (
    <SideBarContainer
      onDragStart={onDragStart}
      className="flex-1 flex flex-col h-full"
      shouldNarrow={shouldNarrow}
      {...props}
    >
      <SideBarHeader
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        shouldNarrow={shouldNarrow}
      ></SideBarHeader>
      <SideBarBody
        shouldNarrow={shouldNarrow}
        tabValue={tabValue}
        setTabValue={setTabValue}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Chat);
          }
        }}
      >
        {tabValue === "chat" && (
          <ChatList narrow={shouldNarrow} searchValue={searchValue} />
        )}
        {tabValue === "task" && <TaskList searchValue={searchValue} />}
      </SideBarBody>
      <SideBarFooter shouldNarrow={shouldNarrow} />
    </SideBarContainer>
  );
}
