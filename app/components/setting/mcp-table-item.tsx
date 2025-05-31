"use client";

import { Button } from "@/app/components/shadcn/button";
import { Switch } from "@/app/components/shadcn/switch";
import FetchIcon from "../../icons/fetch.svg";
import SuccessIcon from "../../icons/access.svg";
import LoadingIcon from "../../icons/loading-spinner.svg";
import ErrorIcon from "../../icons/error.svg";
import clsx from "clsx";
import { useEffect, useMemo, useCallback, useState } from "react";
import { McpItemInfo, McpAction } from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";
import { fetchMcpStatus } from "@/app/utils/mcp";
import { toast } from "sonner";

type McpItemProps = {
  item: McpItemInfo;
  onSwitchChange: (
    enable: boolean,
    id: string,
    name: string,
    aiden_type: string,
  ) => Promise<void>;
  onDelete: (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_name: string,
  ) => Promise<void>;
  onSelect: () => void;
};

export function McpTableItem({
  item,
  onSwitchChange,
  onDelete,
  onSelect,
}: McpItemProps) {
  const {
    mcp_id,
    mcp_name,
    mcp_logo,
    description,
    checked = false,
    type,
  } = item;

  const { updateMcpStatusList } = useMcpStore();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);

  const [status, setStatus] = useState<McpAction | null>(null);

  useEffect(() => {
    const current = mcpStatusList.find((item) => item.name === mcp_name);
    if (current) {
      setStatus(current.action);
    }
  }, [mcpStatusList]);

  const StatusIcon = useMemo(() => {
    if (status === McpAction.Loading) return LoadingIcon;
    else if (status === McpAction.Connected) return SuccessIcon;
    else if (status === McpAction.Failed) return ErrorIcon;
    else return null;
  }, [status]);

  const handleUpdateStatus = useCallback(async (enable: boolean) => {
    const type = enable ? "update" : "delete";
    if (enable) {
      const status = await fetchMcpStatus(mcp_name);
      setStatus(status);
      updateMcpStatusList(
        {
          name: item.mcp_name,
          action: status,
        },
        type,
      );
    }
  }, []);

  const handleCheckedChange = useCallback(async (enable: boolean) => {
    try {
      setStatus(McpAction.Loading);
      updateMcpStatusList(
        {
          name: item.mcp_name,
          action: McpAction.Loading,
        },
        "update",
      );
      await onSwitchChange(enable, mcp_id, mcp_name, type);
      console.log("[Mcp status change]: update remote config done");
      handleUpdateStatus(enable);
    } catch (e: any) {
      toast.error(e, {
        className: "w-auto max-w-max",
      });
    }
  }, []);

  const showDelete = useMemo(() => {
    const { type } = item;
    return type === "custom";
  }, [item]);

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border p-5 cursor-pointer hover:bg-[#F3F5F74D] transition-colors"
      key={mcp_id + mcp_name}
      onClick={onSelect}
    >
      <div className="flex items-top gap-4">
        <div
          className="h-12 flex-shrink-0 flex-center bg-[#E8ECEF] rounded-lg relative"
          style={{
            width: "48px",
          }}
        >
          {mcp_logo ? (
            <img src={mcp_logo} width="30" height="30"></img>
          ) : (
            <FetchIcon style={{ width: "30px", height: "30px" }} />
          )}

          {checked && StatusIcon && (
            <StatusIcon
              className={clsx("absolute right-0 bottom-0 size-4", {
                "animate-spin text-main": status === McpAction.Loading,
              })}
            />
          )}
        </div>
        <div className="flex flex-col">
          <div
            className="text-base font-medium"
            style={{ marginBottom: "4px" }}
          >
            {mcp_name}
          </div>
          <div
            className="text-sm text-[#6C7275]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "24px",
              height: "72px",
            }}
          >
            {description || "No description"}
          </div>
        </div>
      </div>
      <div
        className={`flex mt-auto ${
          showDelete
            ? "justify-between items-center"
            : "justify-end items-center"
        }`}
      >
        {showDelete && (
          <Button
            style={{ padding: "0 10px" }}
            className="bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F]"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              onDelete(e, mcp_name)
            }
          >
            Remove
          </Button>
        )}
        <Switch
          id={mcp_id}
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(enable) => {
            handleCheckedChange(enable);
          }}
        />
      </div>
    </div>
  );
}
