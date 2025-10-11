"use client";

import { useLocation } from "react-router-dom";
import clsx from "clsx";
import styles from "./chat.module.scss";
import { SideBar } from "@/app/components/sidebar";
import { Path } from "../constant";
import { Outlet } from "react-router-dom";
import { WindowHeader } from "../components/window-header";
import { useChatStore } from "../store";

export function WindowLayout({ header = true }: { header: boolean }) {
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const [sessions, selectedIndex] = useChatStore((state) => [
    state.sessions,
    state.currentSessionIndex,
  ]);
  return (
    <div className="flex w-full h-full">
      <SideBar
        className={clsx({
          [styles["sidebar-show"]]: isHome,
        })}
      />
      <div className="flex-1 min-w-0 max-w-[calc(100vw-var(--sidebar-width)-68px)]">
        {header && (
          <WindowHeader>
            <span className="max-w-full line-clamp-1">
              {sessions[selectedIndex].topic}
            </span>
          </WindowHeader>
        )}

        <Outlet />
      </div>
    </div>
  );
}
