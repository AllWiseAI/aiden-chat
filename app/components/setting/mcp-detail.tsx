"use client";

import BackIcon from "../../icons/back.svg";
import FetchIcon from "../../icons/fetch.svg";
import { Switch } from "@/app/components/shadcn/switch";
import { toast } from "sonner";
import { useMcpConfig } from "@/app/hooks/use-mcp-config";
import { Markdown } from "@/app/components/markdown";
import { useState } from "react";

import { McpConfigKey, TDetailInfo } from "@/app/typing";

type Props = {
  setMode: (mode: McpConfigKey) => void;
  detailInfo: TDetailInfo;
};

const McpDetail: React.FC<Props> = ({ setMode, detailInfo }) => {
  const { switchDisable } = useMcpConfig();
  const [checked, setChecked] = useState(detailInfo.checked);

  return (
    <>
      <div
        className="flex justify-between items-center mb-4 cursor-pointer w-max"
        onClick={() => setMode("table")}
      >
        <div className="flex items-center gap-2">
          <BackIcon className="size-6" />
          <span className="text-lg font-bold">MCP Details</span>
        </div>
      </div>

      <div
        className="border rounded-2xl px-5 py-4 mt-6 overflow-y-auto"
        style={{ maxHeight: "calc(100% - 80px)" }}
      >
        <div className="header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#E8ECEF] rounded-sm w-10 h-10 flex items-center justify-center">
              {detailInfo.mcp_logo ? (
                <img className="size-6" src={detailInfo.mcp_logo}></img>
              ) : (
                <FetchIcon className="size-6" />
              )}
            </div>
            <div className="font-medium">{detailInfo.mcp_name}</div>
          </div>
          <div className="mt-4">
            <Switch
              id={"test"}
              checked={checked}
              onCheckedChange={async (enable) => {
                try {
                  setChecked(enable);
                  await switchDisable(
                    detailInfo.mcp_id,
                    detailInfo.mcp_name,
                    enable,
                  );
                  toast.success("切换成功", {
                    className: "w-auto max-w-max",
                  });
                } catch (e: any) {
                  toast.error(e, {
                    className: "w-auto max-w-max",
                  });
                  setChecked(!enable);
                }
              }}
            />
          </div>
        </div>
        <div className="mt-4 text-[#6C7275] text-xs">
          {detailInfo.description}
        </div>
        {detailInfo.tutorial && (
          <div
            className="tutorial mt-6 border-t border-[#E8ECEF80]"
            style={{ paddingTop: "32px" }}
          >
            <Markdown content={detailInfo.tutorial || ""} />
          </div>
        )}
      </div>
    </>
  );
};

export default McpDetail;
