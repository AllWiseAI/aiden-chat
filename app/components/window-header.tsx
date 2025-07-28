"use client";

import { useAppUpdate } from "@/app/hooks/use-app-update";
import clsx from "clsx";
import styles from "./chat.module.scss";
import { ModelSelect } from "./model-select";
import { Button } from "./shadcn/button";
import { Outlet } from "react-router-dom";

export function WindowHeader() {
  const { isShowUpdate, handleUpdate, isUpdating } = useAppUpdate();
  return (
    <>
      <div className={clsx("window-header")} data-tauri-drag-region>
        <div className={clsx("window-header-title", styles["chat-body-title"])}>
          <ModelSelect />
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
