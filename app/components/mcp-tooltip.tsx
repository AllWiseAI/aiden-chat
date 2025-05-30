import { Button } from "@/app/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/shadcn/tooltip";
import { useEffect, useState, ReactElement } from "react";
import AccessIcon from "../icons/access.svg";
import LoadingIcon from "../icons/loading-spinner.svg";
import ErrorIcon from "../icons/error.svg";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useMcpConfig } from "../hooks/use-mcp-config";
import { McpAction } from "@/app/typing";
import { searchMcpServerStatus } from "../services";
import { useDebouncedCallback } from "use-debounce";
import { delay } from "@/app/utils";

type McpItem = {
  name: string;
  action: McpAction;
};

function McpTooltip({ icon }: { icon: ReactElement }) {
  const navigate = useNavigate();
  const { config, disableList } = useMcpConfig();
  const [mcpArr, setMcpArr] = useState<McpItem[]>([]);

  const getMcpStatus = async (enableName: string[]) => {
    // 更新非禁用的状态
    const result = await Promise.all(
      enableName.map(async (name) => {
        try {
          setMcpArr((preArr) =>
            preArr.map((item) =>
              item.name === name
                ? { ...item, action: McpAction.Loading }
                : item,
            ),
          );
          await delay(500);
          const res = (await searchMcpServerStatus(name)) as any;
          if (!res || !res.data) {
            throw new Error("No data");
          }
          const { data } = res;
          if (data.status) return { name, action: data.status };
          else throw new Error("No status");
        } catch (e: any) {
          return { name, action: McpAction.Failed };
        }
      }),
    );
    // 只修改loading的item状态
    setMcpArr((prevArr) =>
      prevArr.map((item) => {
        const updated = result.find((r) => r.name === item.name);
        return updated ? { ...item, action: updated.action } : item;
      }),
    );
  };

  useEffect(() => {
    if (!config) {
      setMcpArr([]);
      return;
    }
    const result = Object.entries(config!.mcpServers)
      .filter(([name]) => !disableList.includes(name))
      .map(([name]) => ({
        name,
        action: McpAction.Loading,
      }));
    setMcpArr(result);
  }, [disableList, config]);

  useEffect(() => {
    const hasLoading = mcpArr.some((item) => item.action === McpAction.Loading);
    if (!hasLoading) return;
    // 轮询
    const interval = setInterval(async () => {
      const enableName = mcpArr
        .filter((item) => item.action === McpAction.Loading)
        .map((item) => item.name);
      await getMcpStatus(enableName);
    }, 5000);

    return () => clearInterval(interval);
  }, [mcpArr]);

  const updateStatus = useDebouncedCallback(
    async () => {
      const enableName = mcpArr
        .filter((item) => item.action === McpAction.Loading)
        .map((item) => item.name);
      await getMcpStatus(enableName);
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
          className="flex flex-col gap-2 items-center bg-white text-black dark:bg-[#232627] dark:text-white p-2 mb-2 text-sm font-medium"
          style={{
            boxShadow: `
                    0px 0px 24px 4px rgba(0,0,0,0.05),
                    0px 32px 48px -4px rgba(0,0,0,0.2)
                `,
          }}
        >
          {mcpArr.length ? (
            <div className="w-40 max-h-[300px] overflow-y-auto">
              {mcpArr.map((item) => {
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
                    className="h-8 p-2 flex justify-between items-center"
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
