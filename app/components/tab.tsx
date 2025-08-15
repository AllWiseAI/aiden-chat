import { useNavigate, useLocation } from "react-router-dom";
import { useAppConfig, useTaskStore } from "../store";
import { Path } from "../constant";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import ChatIcon from "../icons/chat.svg";
import TaskIcon from "../icons/task.svg";
import LogoIcon from "../icons/logo-circle.svg";

export function Tab() {
  const navigate = useNavigate();
  const location = useLocation();
  const debugMode = useAppConfig().debugMode;
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const { t } = useTranslation("general");
  const [tabValue, setTabValue] = useState<"chat" | "task">("chat");

  return (
    <div className="shrink-0 flex flex-col justify-between items-center w-17 pt-10 pb-4 bg-[#6C7275]/20 dark:bg-[#292A2D]">
      <div className="flex flex-col gap-5 items-center">
        <LogoIcon
          className={clsx(
            "size-[34px] hover:text-[#00AB66] transition-colors cursor-pointer",
            location.pathname === Path.Settings
              ? "text-[#00AB66]"
              : "text-[#00AB66]/40",
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
            onClick={() => {
              setTabValue("chat");
              navigate(Path.Chat);
            }}
          >
            <div className="rounded- w-12.5 h-11.5 flex-center flex-col gap-[2px]">
              <ChatIcon />
              <span className="text-xs">{t("sidebar.chat")}</span>
            </div>
          </div>
          <div
            className={clsx(
              "flex-center flex-col cursor-pointer rounded-lg",
              tabValue === "task"
                ? "text-main bg-[#F3F5F7] dark:bg-[#141718]"
                : "text-[#6C7275] dark:text-[#E8ECEF]/50 hover:bg-white/80 dark:hover:bg-white/10",
            )}
            onClick={() => {
              setTabValue("task");
              navigate(`${Path.Task}/${currentTaskId}`);
            }}
          >
            <div className=" w-12.5 h-11.5 flex-center flex-col gap-[2px]">
              <TaskIcon />
              <span className="text-xs">{t("sidebar.task")}</span>
            </div>
          </div>
        </div>
      </div>
      {debugMode && "AidenDebug"}
    </div>
  );
}
