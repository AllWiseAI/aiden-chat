import { Button } from "@/app/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { useMemo, ReactElement } from "react";
import AccessIcon from "../icons/access.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import ErrorIcon from "../icons/error.svg";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useMcpConfig } from "../hooks/use-mcp-config";
import { McpAction } from "@/app/typing";
import { searchMcpServerStatus } from "../services";
import { useDebouncedCallback } from "use-debounce";

function McpTooltip({ icon }: { icon: ReactElement }) {
  const navigate = useNavigate();
  const { statusMap, setStatusMap } = useMcpConfig();

  const mcpArr = useMemo(
    () =>
      Object.entries(statusMap).map(([name, action]) => {
        let icon;
        if (action === McpAction.Connecting) {
          icon = LoadingIcon;
        } else if (action === McpAction.Connected) {
          icon = AccessIcon;
        } else if (action === McpAction.Disconnected) {
          icon = ErrorIcon;
        }
        return { name, action, icon };
      }),
    [statusMap],
  );

  const updateStatus = useDebouncedCallback(
    async () => {
      await Promise.all(
        Object.entries(statusMap).map(async ([name]) => {
          try {
            setStatusMap((m) => ({
              ...m,
              [name]: McpAction.Connecting,
            }));
            const { data } = (await searchMcpServerStatus(name)) as any;
            setStatusMap((m) => ({
              ...m,
              [name]:
                data?.status === "connected"
                  ? McpAction.Connected
                  : McpAction.Disconnected,
            }));
          } catch {
            setStatusMap((m) => ({
              ...m,
              [name]: McpAction.Disconnected,
            }));
          }
        }),
      );
    },
    5000,
    { leading: true, trailing: false },
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="border border-[#E8ECEF] text-sm font-semibold p-2"
            onMouseEnter={updateStatus}
          >
            {icon}
            MCP
          </Button>
        </TooltipTrigger>
        <TooltipContent
          hasArrow={false}
          className="flex flex-col items-center bg-white text-black dark:bg-[#232627] dark:text-white p-2 mb-2 text-sm font-medium"
          style={{
            boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
          }}
        >
          {mcpArr.map((item) => (
            <div
              key={item.name}
              className="w-30 h-8 p-2 flex justify-between items-center"
            >
              <p
                className="text-[#6C7275] h-4 text-xs"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxWidth: "90px",
                }}
              >
                {item.name}
              </p>
              <item.icon
                className={clsx("", {
                  "animate-spin size-4 text-[#6C7275]":
                    item.action === McpAction.Connecting,
                })}
              />
            </div>
          ))}
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
