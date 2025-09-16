import { Button } from "@/app/components/shadcn/button";
import { useMemo, useEffect, ReactElement } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/shadcn/popover";
import FetchIcon from "../icons/fetch.svg";
import RightIcon from "../icons/right-arrow.svg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Path } from "../constant";
import { McpAction } from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";
import { track, EVENTS } from "@/app/utils/analysis";
import { Tooltip, TooltipTrigger, TooltipContent } from "./shadcn/tooltip";

function McpPopover({ icon }: { icon: ReactElement }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);
  const mcpRenderedMap = useMcpStore((state) => state.mcpRenderedMap);

  useEffect(() => {
    track(EVENTS.MCP_STORE_OPEN, {
      count: mcpStatusList.length,
    });
  }, [mcpStatusList]);

  const SuccessStatusIcon = useMemo(() => {
    return (
      <div className="absolute -bottom-[2px] -right-[2px] w-1 h-1 bg-[#00AB66] rounded-full animate-[breathing_2s_ease-in-out_infinite"></div>
    );
  }, []);

  const FailedStatusIcon = useMemo(() => {
    return (
      <div className="absolute -bottom-1 -right-[2px] w-1 h-1 bg-[#EF466F] rounded-full animate-[breathing_2s_ease-in-out_infinite"></div>
    );
  }, []);

  const LoadingStatusIcon = useMemo(() => {
    return (
      <div className="absolute -bottom-1 -right-[2px] w-1 h-1 bg-[#F8E243] rounded-full animate-ping"></div>
    );
  }, []);

  const handleMcpClick = () => {
    track(EVENTS.MCP_BUTTON_CLICK);
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              onClick={handleMcpClick}
              className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] font-medium !rounded-sm p-2.5 w-9 h-8 hover:bg-[#F3F5F7] dark:hover:bg-[#232627]"
            >
              {icon}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-40 flex flex-col gap-2 items-center bg-white text-black dark:bg-[#101213] dark:text-white p-2 text-sm font-medium"
            style={{
              boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
            }}
          >
            {mcpStatusList.length ? (
              <div className="w-40 max-h-40 overflow-y-auto">
                {mcpStatusList.map((item) => {
                  let StatusIcon;
                  if (item.action === McpAction.Loading)
                    StatusIcon = LoadingStatusIcon;
                  else if (item.action === McpAction.Connected)
                    StatusIcon = SuccessStatusIcon;
                  else if (item.action === McpAction.Failed)
                    StatusIcon = FailedStatusIcon;

                  return (
                    <div
                      key={item.name}
                      className="h-8 p-2 flex items-center gap-2"
                    >
                      <div className="relative !w-[14px] !h-[14px]">
                        {mcpRenderedMap.get?.(item.name)?.icon !== "" ? (
                          <img
                            src={mcpRenderedMap.get?.(item.name)?.icon}
                            className="size-[14px]"
                          ></img>
                        ) : (
                          <FetchIcon className="size-[14px] text-[#343839] dark:text-white" />
                        )}

                        {StatusIcon}
                      </div>
                      <p
                        className="text-black dark:text-white h-4 text-xs"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: "110px",
                        }}
                      >
                        {mcpRenderedMap.get?.(item.name)?.renderName ||
                          item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 text-gray-500 whitespace-nowrap">
                No Mcp Servers
              </div>
            )}
            <div
              className="group h-[30px] text-xs flex justify-between items-center w-full bg-[#E8ECEF]/50 dark:bg-[#232627]/50 hover:text-[#00AB66] text-center hover:opacity-80 cursor-pointer rounded-sm px-2.5"
              onClick={() => navigate(Path.Settings + "?tab=mcp")}
            >
              Manage
              <RightIcon className="size-4 dark:text-[#6C7275] dark:group-hover:text-[#00AB66]" />
            </div>
          </PopoverContent>
        </Popover>
      </TooltipTrigger>
      <TooltipContent>{t("chat.mcp.tip")}</TooltipContent>
    </Tooltip>
  );
}

export default McpPopover;
