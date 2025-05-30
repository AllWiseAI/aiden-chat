"use client";

import { Button } from "@/app/components/shadcn/button";
import { Switch } from "@/app/components/shadcn/switch";
import FetchIcon from "../../icons/fetch.svg";
import SuccessIcon from "../../icons/access.svg";
import LoadingIcon from "../../icons/loading-spinner.svg";
import ErrorIcon from "../../icons/error.svg";
import clsx from "clsx";
import { useState, useEffect, useMemo } from "react";
import { McpItemInfo, McpAction } from "@/app/typing";
import { searchMcpServerStatus } from "@/app/services";
import { delay } from "@/app/utils";

type McpItemProps = {
  item: McpItemInfo;
  onSwitchChange: (enable: boolean, id: string, name: string) => Promise<void>;
  onDelete: (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_id: string,
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
  const [status, setStatus] = useState<McpAction | null>(null);
  const StatusIcon = useMemo(() => {
    if (status === McpAction.Loading) return LoadingIcon;
    else if (status === McpAction.Connected) return SuccessIcon;
    else if (status === McpAction.Failed) return ErrorIcon;
    else return null;
  }, [status]);

  const {
    mcp_id,
    mcp_name,
    mcp_logo,
    description,
    checked = false,
    type,
    showDelete,
  } = item;

  // 切换时尝试更新状态
  useEffect(() => {
    if (!checked) {
      setStatus(null);
      return;
    }
    setStatus(McpAction.Loading);
    async function fetchStatus() {
      await delay(500);
      try {
        const res = (await searchMcpServerStatus(mcp_name)) as any;
        if (!res || !res.data) {
          throw new Error("No data");
        }
        const { data } = res;
        if (data.status) {
          setStatus(data.status);
        } else throw new Error("No status");
      } catch (error) {
        console.error("Failed to fetch MCP server status", error);
        setStatus(McpAction.Failed);
      }
    }
    fetchStatus();
  }, [checked]);

  // loading 状态轮询
  useEffect(() => {
    if (status !== McpAction.Loading) return;
    const interval = setInterval(async () => {
      try {
        const res = (await searchMcpServerStatus(mcp_name)) as any;
        if (!res || !res.data) {
          throw new Error("No data");
        }
        const { data } = res;
        if (data.status) {
          setStatus(data.status);
        } else throw new Error("No status");
      } catch (error) {
        console.error("Failed to fetch MCP server status", error);
        setStatus(McpAction.Failed);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border p-4 cursor-pointer hover:bg-[#F3F5F74D] transition-colors"
      key={mcp_id + mcp_name}
      onClick={onSelect}
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
                "animate-spin text-main": status === McpAction.Loading,
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
        className={`flex mt-auto ${
          showDelete ? "justify-between items-end" : "justify-end items-center"
        }`}
      >
        {showDelete && (
          <Button
            className="bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F]"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              onDelete(e, mcp_id, mcp_name)
            }
          >
            Remove
          </Button>
        )}
        <Switch
          id={mcp_id}
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(enable) => onSwitchChange(enable, mcp_id, mcp_name)}
        />
      </div>
    </div>
  );
}
