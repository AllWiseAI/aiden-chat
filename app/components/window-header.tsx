"use client";

import { useAppUpdate } from "@/app/hooks/use-app-update";
import { useDragSideBar } from "@/app/components/sidebar";
import clsx from "clsx";
import styles from "./chat.module.scss";
import { ModelSelect } from "./model-select";
import { Button } from "./shadcn/button";
import { Outlet } from "react-router-dom";
import CollapseIcon from "../icons/collapse.svg";

export function WindowHeader({ model = false }: { model: boolean }) {
  const { isShowUpdate, handleUpdate, isUpdating } = useAppUpdate();
  const { shouldNarrow, toggleSideBar } = useDragSideBar();
  return (
    <>
      <div className={clsx("window-header", "h-15")} data-tauri-drag-region>
        <div className={clsx("window-header-title", styles["chat-body-title"])}>
          {shouldNarrow && (
            <Button
              variant="ghost"
              className="bg-[#F3F5F7] size-[30px]"
              onClick={toggleSideBar}
            >
              <CollapseIcon className="size-5" />
            </Button>
          )}
          {model && <ModelSelect />}
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
      <Outlet />
    </>
  );
}
