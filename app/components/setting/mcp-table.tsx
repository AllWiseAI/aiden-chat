"use client";

import { Button } from "@/app/components/shadcn/button";
import { Switch } from "@/app/components/shadcn/switch";
import { toast } from "sonner";
import FetchIcon from "../../icons/fetch.svg";
import SuccessIcon from "../../icons/access.svg";
import LoadingIcon from "../../icons/loading-spinner.svg";
import ErrorIcon from "../../icons/error.svg";
import { useMcpConfig } from "@/app/hooks/use-mcp-config";
import {
  showConfirm,
  ConfirmType,
} from "@/app/components/confirm-modal/confirm";
import clsx from "clsx";
import {
  McpItemInfo,
  McpAction,
  McpConfigKey,
  TDetailInfo,
} from "@/app/typing";

type ServerTableProps = {
  servers: McpItemInfo[];
  disabledList: string[];
  statusMap: Record<string, McpAction>;
  switchDisable: (mcp_id: string, mcp_name: string, enable: boolean) => void;
  setDetail: (detailInfo: McpItemInfo) => void;
  delMcpItem: (mcp_id: string, mcp_name: string) => void;
};

type Props = {
  setDetail: (detailInfo: TDetailInfo) => void;
  setMode: (mode: McpConfigKey) => void;
};

function ServerTable({
  setDetail,
  servers,
  statusMap,
  switchDisable,
  delMcpItem,
}: ServerTableProps) {
  const handleDeleteMcp = async (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_id: string,
    mcp_name: string,
  ) => {
    e.stopPropagation();
    let result = await showConfirm({
      title: "Delete",
      description: "Confirm to delete?",
      type: "delete",
    });
    if (result !== ConfirmType.Confirm) return;
    try {
      await delMcpItem(mcp_id, mcp_name);
      toast.success("Delete Successfully");
    } catch (e) {
      toast.error("Delete Failed");
    }
  };
  return (
    <div className="grid grid-cols-2 gap-5">
      {servers.map(
        ({
          mcp_id,
          mcp_name,
          mcp_logo,
          description,
          checked = false,
          tutorial,
          type,
          showDelete,
        }) => {
          const status = statusMap[mcp_name];
          let StatusIcon = ErrorIcon;
          if (status === McpAction.Connecting) StatusIcon = LoadingIcon;
          else if (status === McpAction.Connected) StatusIcon = SuccessIcon;
          return (
            <div
              className="flex flex-col gap-5 rounded-xl border p-4 cursor-pointer hover:bg-[#F3F5F74D] transition-colors"
              key={mcp_id + mcp_name}
              onClick={() =>
                setDetail({
                  type,
                  showDelete,
                  mcp_id,
                  mcp_name,
                  mcp_logo,
                  description,
                  checked,
                  tutorial,
                })
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 flex-center bg-gray-200 rounded-lg relative">
                  {mcp_logo ? (
                    <img src={mcp_logo} className="size-6"></img>
                  ) : (
                    <FetchIcon />
                  )}

                  {type === "json" && StatusIcon && (
                    <StatusIcon
                      className={clsx("absolute right-0 bottom-0 size-4", {
                        "animate-spin text-main":
                          status === McpAction.Connecting,
                      })}
                    />
                  )}
                </div>
                <div className="text-base">{mcp_name}</div>
              </div>
              <div
                className="text-xs text-[#6C7275]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  height: "48px",
                }}
              >
                {description || "No description"}
              </div>
              <div
                className={`flex items-center ${
                  showDelete ? "justify-between" : "justify-end"
                }`}
              >
                {showDelete && (
                  <Button
                    className="bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F]"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      handleDeleteMcp(e, mcp_id, mcp_name)
                    }
                  >
                    Remove
                  </Button>
                )}
                <Switch
                  id={mcp_id}
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={async (enable) => {
                    try {
                      await switchDisable(mcp_id, mcp_name, enable);
                      toast.success("切换成功", {
                        className: "w-auto max-w-max",
                      });
                    } catch (e: any) {
                      toast.error(e, {
                        className: "w-auto max-w-max",
                      });
                    }
                  }}
                />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

const McpTable: React.FC<Props> = ({ setMode, setDetail }) => {
  const { disabledList, statusMap, switchDisable, mcpItemsList, delMcpItem } =
    useMcpConfig();

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">MCP Management</h2>
        <Button
          className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] dark:text-black border border-[#00D47E]/10 font-medium text-sm rounded-xl"
          onClick={() => setMode("edit")}
        >
          Edit Config
        </Button>
      </div>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100% - 80px)" }}
      >
        <ServerTable
          servers={mcpItemsList}
          disabledList={disabledList}
          statusMap={statusMap}
          switchDisable={switchDisable}
          setDetail={setDetail}
          delMcpItem={delMcpItem}
        />
      </div>
    </>
  );
};

export default McpTable;
