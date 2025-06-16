import { Button } from "@/app/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { ReactElement, useMemo } from "react";
import AccessIcon from "../icons/access.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import ErrorIcon from "../icons/error.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { McpAction } from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";

function McpTooltip({ icon }: { icon: ReactElement }) {
  const navigate = useNavigate();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);

  const allFailed = useMemo(() => {
    return mcpStatusList.every((item) => item.action === McpAction.Failed);
  }, [mcpStatusList]);

  const hasLoading = useMemo(() => {
    return mcpStatusList.some((item) => item.action === McpAction.Loading);
  }, [mcpStatusList]);

  const hasSuccess = useMemo(() => {
    if (hasLoading) return false;
    return mcpStatusList.some((item) => item.action === McpAction.Connected);
  }, [mcpStatusList, hasLoading]);

  const shouldShowStatusIcon = useMemo(() => {
    return mcpStatusList.length > 0;
  }, [mcpStatusList]);

  const SuccessStatusIcon = useMemo(() => {
    return (
      <div className="absolute bottom-2 left-6 w-1 h-1 bg-[#00AB66] rounded-full animate-[breathing_2s_ease-in-out_infinite"></div>
    );
  }, []);

  const FailedStatusIcon = useMemo(() => {
    return (
      <div className="absolute bottom-2 left-6 w-1 h-1 bg-[#EF466F] rounded-full animate-[breathing_2s_ease-in-out_infinite"></div>
    );
  }, []);

  const LoadingStatusIcon = useMemo(() => {
    return (
      <div className="absolute bottom-2 left-6 w-1 h-1 bg-[#F8E243] rounded-full animate-[breathing_2s_ease-in-out_infinite"></div>
    );
  }, []);

  const renderStatusIcon = useMemo(() => {
    if (hasSuccess) return SuccessStatusIcon;
    if (allFailed) return FailedStatusIcon;
    if (hasLoading) return LoadingStatusIcon;
    return null;
  }, [
    hasSuccess,
    allFailed,
    hasLoading,
    FailedStatusIcon,
    SuccessStatusIcon,
    LoadingStatusIcon,
  ]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="border relative border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#6C7275] text-sm font-semibold p-2"
            // onMouseEnter={updateStatus}
          >
            {icon}
            MCP
            {shouldShowStatusIcon && renderStatusIcon}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          hasArrow={false}
          className="flex flex-col gap-2 items-center bg-white text-black dark:bg-[#232627] dark:text-white p-2 mb-2 text-sm font-medium"
          style={{
            boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
          }}
        >
          {mcpStatusList.length ? (
            <div className="w-40 max-h-[300px] overflow-y-auto">
              {mcpStatusList.map((item) => {
                let StatusIcon;
                if (item.action === McpAction.Loading)
                  StatusIcon = (
                    <LoadingIcon className="animate-spin size-4 text-[#6C7275]" />
                  );
                else if (item.action === McpAction.Connected)
                  StatusIcon = <AccessIcon />;
                else if (item.action === McpAction.Failed)
                  StatusIcon = <ErrorIcon />;
                return (
                  <div
                    key={item.name}
                    className="h-8 p-2 flex justify-between items-center gap-2"
                  >
                    <p
                      className="text-[#6C7275] h-4 text-xs"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        maxWidth: "110px",
                      }}
                    >
                      {item.name}
                    </p>
                    {StatusIcon}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 text-gray-500">No Mcp</div>
          )}
          <div
            className="w-max text-main text-center hover:opacity-80 cursor-pointer"
            onClick={() => navigate(Path.Settings + "?tab=mcp")}
          >
            Manage
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default McpTooltip;
