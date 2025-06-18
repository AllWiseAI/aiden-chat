import { Button } from "@/app/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/shadcn/popover";
import { ReactElement } from "react";
import RightIcon from "../icons/right-arrow.svg";
import AccessIcon from "../icons/access.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import ErrorIcon from "../icons/error.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { McpAction } from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";

function McpPopover({ icon }: { icon: ReactElement }) {
  const navigate = useNavigate();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] text-xs font-medium !rounded-sm p-2.5 h-[30px]"
        >
          {icon}
          MCP
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-40 flex flex-col gap-2 items-center bg-white text-black dark:bg-[#101213] dark:text-white p-2 mb-2 text-sm font-medium"
        style={{
          boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
        }}
      >
        {mcpStatusList.length ? (
          <div className="max-h-40 overflow-y-auto">
            {mcpStatusList.map((item) => {
              let StatusIcon;
              if (item.action === McpAction.Loading)
                StatusIcon = (
                  <LoadingIcon className="animate-spin size-4 text-[#6C7275]" />
                );
              else if (item.action === McpAction.Connected)
                StatusIcon = <AccessIcon className="size-4" />;
              else if (item.action === McpAction.Failed)
                StatusIcon = <ErrorIcon className="size-4" />;
              return (
                <div
                  key={item.name}
                  className="h-8 p-2 flex items-center gap-2"
                >
                  {StatusIcon}
                  <p
                    className="h-4 text-xs"
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-gray-500">No Mcp</div>
        )}
        <div
          className="h-[30px] flex justify-between items-center w-full bg-[#E8ECEF]/50 dark:bg-[#232627]/50 hover:text-[#00AB66] text-center hover:opacity-80 cursor-pointer rounded-sm px-2.5"
          onClick={() => navigate(Path.Settings + "?tab=mcp")}
        >
          Manage
          <RightIcon />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default McpPopover;
