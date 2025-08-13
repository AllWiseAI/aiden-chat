import { useState, ReactNode } from "react";
import { useAppUpdate } from "@/app/hooks/use-app-update";
import { useDragSideBar } from "@/app/components/sidebar";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import styles from "./chat.module.scss";
import { Button } from "./shadcn/button";
import { InviteDialog } from "./invite-dialog";
import UpdateIcon from "../icons/up-arrow.svg";
import LogoIcon from "../icons/logo.svg";
import CollapseIcon from "../icons/collapse.svg";

export function WindowHeader({ children }: { children?: ReactNode }) {
  const { t } = useTranslation("general");
  const { isShowUpdate, handleUpdate, isUpdating } = useAppUpdate();
  const { shouldNarrow, toggleSideBar } = useDragSideBar();
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className={clsx("window-header", "h-15")} data-tauri-drag-region>
      <div className={clsx("window-header-title", styles["chat-body-title"])}>
        {shouldNarrow && (
          <Button
            variant="ghost"
            className="bg-[#F3F5F7] dark:bg-[#232627] size-[30px]"
            onClick={toggleSideBar}
          >
            <CollapseIcon className="size-5" />
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2.5 h-[30px] text-sm">
        {isShowUpdate && (
          <Button
            disabled={isUpdating}
            data-tauri-drag-region="false"
            className="flex-center h-full px-1.5 py-1 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main rounded-2xl"
            onClick={handleUpdate}
          >
            <div className="bg-main rounded-full size-4">
              <UpdateIcon className="size-4 text-white dark:text-[#141718]" />
            </div>

            {isUpdating
              ? t("settings.update.updating")
              : t("settings.update.update")}
          </Button>
        )}
        <Button
          onClick={() => setShowInvite(true)}
          className="flex-center h-full px-1.5 py-1 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main rounded-2xl"
        >
          <LogoIcon className="size-4 text-main mb-[2px]" />
          <span>{t("invite.btn")}</span>
        </Button>
      </div>

      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
}
