"use client";

import { useLocation } from "react-router-dom";
import clsx from "clsx";
import styles from "./chat.module.scss";
import { ModelSelect } from "./model-select";
import { SideBar } from "@/app/components/sidebar";
import { Path } from "../constant";
import { Outlet } from "react-router-dom";
import { WindowHeader } from "../components/window-header";

export function WindowLayout({ header = true }: { header: boolean }) {
  const location = useLocation();
  const isHome = location.pathname === Path.Home;

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
            <ModelSelect />
          </WindowHeader>
        )}

        <Outlet />
      </div>
    </div>
  );
}
