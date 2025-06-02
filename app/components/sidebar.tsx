import React, { Fragment, useEffect, useState, useMemo, useRef } from "react";

import styles from "./home.module.scss";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/shadcn/dropdown-menu";
import { Button } from "@/app/components/shadcn/button";
import { Input } from "@/app/components/shadcn/input";
import LogoutIcon from "../icons/logout.svg";
import SettingIcon from "../icons/setting.svg";
import SearchIcon from "../icons/search.svg";
import CollapseIcon from "../icons/collapse.svg";
import PlusIcon from "../icons/plus.svg";
import { toast } from "sonner";
import { useAppConfig, useAuthStore, useChatStore } from "../store";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import { useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import clsx from "clsx";
// import { exportAndDownloadLog } from "../utils/log";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
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
      className={clsx(styles.sidebar, className, {
        [styles["narrow-sidebar"]]: shouldNarrow,
      })}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {children}
      <div
        className="absolute w-[2px] h-full top-0 right-0 transition-all ease-in-out duration-300 hover:bg-[#00D47E] cursor-ew-resize"
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
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const { toggleSideBar } = useDragSideBar();

  const logout = async () => {
    navigate(Path.Login);
    try {
      const success = await authStore.logout();
      if (success) {
        toast.success("Logout success", {
          className: "w-auto max-w-max",
        });
      }
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    }
  };
  return (
    <Fragment>
      <div className="flex justify-between items-center h-20 gap-4 overflow-hidden px-6 pt-10 dark:border-[#232627] select-none">
        {!shouldNarrow && (
          <>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="size-10 cursor-pointer">
                    <AvatarImage src={authStore.user.profile} />
                    <AvatarFallback>{authStore.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="px-2 py-4 rounded-xl flex flex-col gap-3"
                  align="start"
                  side="right"
                >
                  <DropdownMenuRadioGroup>
                    <DropdownMenuRadioItem
                      value="settings"
                      className="flex justify-start gap-4 !px-2 !py-2"
                      onClick={() => navigate(Path.Settings)}
                    >
                      <SettingIcon className="size-4" />
                      <span className="-ml-1 text-xs font-medium">
                        Settings
                      </span>
                    </DropdownMenuRadioItem>
                    {/* <DropdownMenuRadioItem
                      value="exportlog"
                      className="flex justify-start gap-4 !px-2 !py-2"
                      onClick={exportAndDownloadLog}
                    >
                      <ExportIcon className="size-4" />
                      <span className="-ml-1 text-xs font-medium">
                        Export Logs
                      </span>
                    </DropdownMenuRadioItem> */}
                    <DropdownMenuRadioItem
                      value="logout"
                      className="flex justify-start gap-4 !px-2 !py-2"
                      onClick={logout}
                    >
                      <LogoutIcon className="size-4" />
                      <span className="-ml-1 text-xs font-medium">Log out</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* <span className="text-sm font-semibold flex-1 overflow-hidden text-ellipsis cursor-default leading-6 whitespace-nowrap">
              {authStore.user.name}
            </span> */}
          </>
        )}
        <div className="flex gap-2">
          {!shouldNarrow && (
            <Button variant="ghost" className="size-8" onClick={toggleSearch}>
              <SearchIcon className="size-6" />
            </Button>
          )}
          <Button variant="ghost" className="size-8" onClick={toggleSideBar}>
            <CollapseIcon className="size-6" />
          </Button>
        </div>
      </div>
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  shouldNarrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const { children, shouldNarrow = false } = props;

  return (
    !shouldNarrow && (
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex flex-col gap-1 px-2.5 pt-2.5">{children}</div>
      </div>
    )
  );
}

export function SideBarFooter(props: {
  children?: React.ReactNode;
  shouldNarrow?: boolean;
}) {
  const { children, shouldNarrow = false } = props;

  return (
    !shouldNarrow && (
      <div className="flex justify-start gap-2.5 px-2.5 py-2.5">{children}</div>
    )
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Chat);
          }
        }}
      >
        {!shouldNarrow && (
          <>
            <div className="flex flex-col gap-2 sticky top-0 bg-white">
              {isSearchVisible && (
                <div className="flex-center relative">
                  <Input
                    className="h-10 !text-left placeholder:text-sm !placeholder:text-[#6C7275]/50 px-12 py-3.5 rounded-xl"
                    clearable
                    value={searchValue}
                    placeholder="Search"
                    onChange={(e) => setSearchValue(e.target.value)}
                  />

                  <SearchIcon className="absolute top-1/2 left-4 transform -translate-y-1/2 size-6 text-[#6C7275]/50" />
                </div>
              )}
              <Button
                variant="ghost"
                className="h-10 text-[#00D47E] hover:text-[#00D47E] dark:text-black flex justify-start items-center gap-3 px-5 py-3 rounded-full"
                onClick={() => {
                  chatStore.newSession();
                  navigate(Path.Chat);
                }}
              >
                <PlusIcon className="size-4" />
                <span className="font-medium select-none">New Chat</span>
              </Button>
            </div>
          </>
        )}
        <ChatList narrow={shouldNarrow} searchValue={searchValue} />
      </SideBarBody>
    </SideBarContainer>
  );
}
