import { useNavigate, useLocation } from "react-router-dom";
import { useAppConfig, useTaskStore } from "../store";
import { Path } from "../constant";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppUpdate } from "@/app/hooks/use-app-update";
import { Button } from "./shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./shadcn/tooltip";
import { InviteDialog } from "./invite-dialog";
import clsx from "clsx";
import ChatIcon from "../icons/chat.svg";
import TaskIcon from "../icons/task.svg";
import LogoIcon from "../icons/logo-circle.svg";
import UpdateIcon from "../icons/up-arrow.svg";
import InviteIcon from "../icons/invite.svg";
import UpdatingIcon from "../icons/updating.svg";

export function Tab() {
  const navigate = useNavigate();
  const location = useLocation();
  const debugMode = useAppConfig().debugMode;
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const { t, i18n } = useTranslation("general");
  const [tabValue, setTabValue] = useState<"chat" | "task" | "settings">(
    "chat",
  );
  const [showInvite, setShowInvite] = useState(false);
  const { isShowUpdate, handleUpdate, isUpdating } = useAppUpdate();

  useEffect(() => {
    if (location.pathname.includes(Path.Settings)) {
      setTabValue("settings");
    } else if (
      location.pathname.includes(Path.Task) ||
      location.pathname.includes(Path.NewTask)
    ) {
      setTabValue("task");
    } else if (location.pathname.includes(Path.Chat)) {
      setTabValue("chat");
    }
  }, [location]);

  return (
    <div className="shrink-0 flex flex-col justify-between items-center w-17 pt-10 pb-4 bg-[#6C7275]/20 dark:bg-[#292A2D]">
      <div className="flex flex-col gap-5 items-center">
        <LogoIcon
          className={clsx(
            "size-[34px] hover:text-[#00AB66] transition-colors cursor-pointer",
            tabValue === "settings" ? "text-[#00AB66]" : "text-[#00AB66]/40",
          )}
          onClick={() => {
            if (location.pathname !== Path.Settings) {
              navigate(Path.Settings);
            }
          }}
        />
        <div className="flex flex-col gap-3">
          <div
            className={clsx(
              "flex-center flex-col cursor-pointer rounded-lg",
              tabValue === "chat"
                ? "text-main bg-[#F3F5F7] dark:bg-[#141718]"
                : "text-[#6C7275] dark:text-[#E8ECEF]/50 hover:bg-white/80 dark:hover:bg-white/10",
            )}
            onClick={() => navigate(Path.Chat)}
          >
            <div className="w-12.5 h-11.5 flex-center flex-col gap-[2px]">
              <ChatIcon />
              <span
                className={clsx(
                  tabValue === "chat" ? "font-bold" : "font-normal",
                  i18n.language === "en-US" ? "text-[10px]" : "text-xs",
                )}
              >
                {t("sidebar.chat")}
              </span>
            </div>
          </div>
          <div
            className={clsx(
              "flex-center flex-col cursor-pointer rounded-lg px-1 min-w-min",
              tabValue === "task"
                ? "text-main bg-[#F3F5F7] dark:bg-[#141718]"
                : "text-[#6C7275] dark:text-[#E8ECEF]/50 hover:bg-white/80 dark:hover:bg-white/10",
            )}
            onClick={() => navigate(`${Path.Task}/${currentTaskId}`)}
          >
            <div className="h-11.5 flex-center flex-col gap-[2px]">
              <TaskIcon />
              <span
                className={clsx(
                  tabValue === "task" ? "font-bold" : "font-normal",
                  i18n.language === "en-US" ? "text-[10px]" : "text-xs",
                )}
              >
                {t("sidebar.schedule")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-2.5 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowInvite(true)}
                className="size-7 flex-center !px-1.5 py-1 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main rounded-2xl"
              >
                <InviteIcon className="size-4 text-main" />
              </Button>
            </TooltipTrigger>
            <TooltipContent hasArrow={false}>
              <span className="cursor-default">{t("invite.btn")}</span>
            </TooltipContent>
          </Tooltip>
          {isShowUpdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={isUpdating}
                  className="relative size-7 flex-center px-1.5 py-1 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main rounded-2xl"
                  onClick={handleUpdate}
                >
                  <div className="bg-main rounded-full size-4">
                    <UpdateIcon className="size-4 text-white dark:text-[#141718]" />
                  </div>
                  {isUpdating ? (
                    <div className="absolute top-0 left-0 size-7 animate-spin">
                      <UpdatingIcon className="" />
                    </div>
                  ) : (
                    <div className="absolute right-0 top-0 bg-[#ED6A5F] size-2 rounded-full"></div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent hasArrow={false}>
                <span className="cursor-default">
                  {isUpdating
                    ? t("settings.update.updating")
                    : t("settings.update.update")}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {debugMode && (
          <div className="flex flex-col items-center">
            <span>Aiden</span>
            <span>Debug</span>
          </div>
        )}
      </div>
      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
}
