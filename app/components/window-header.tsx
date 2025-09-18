import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useDragSideBar } from "@/app/components/sidebar";
import AgentTab from "./agent-tab";

import clsx from "clsx";
import styles from "./chat.module.scss";
import { Button } from "./shadcn/button";

import CollapseIcon from "../icons/collapse.svg";
import { Path } from "../constant";

export function WindowHeader({ children }: { children?: ReactNode }) {
  const { shouldNarrow, toggleSideBar } = useDragSideBar();
  const location = useLocation();
  const isChat = useMemo(() => location.pathname === Path.Chat, []);

  return (
    <div className={clsx("window-header", "h-15")} data-tauri-drag-region>
      <div className={clsx("window-header-title", styles["chat-body-title"])}>
        {shouldNarrow && (
          <Button
            variant="ghost"
            className="bg-[#F3F5F7] dark:bg-[#232627] size-[30px] rounded-sm hover:bg-[#E8ECEF]"
            onClick={toggleSideBar}
          >
            <CollapseIcon className="size-5" />
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2.5 h-[30px] text-sm">
        {isChat && <AgentTab />}
      </div>
    </div>
  );
}
