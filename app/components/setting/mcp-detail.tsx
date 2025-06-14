"use client";

import BackIcon from "../../icons/back.svg";
import FetchIcon from "../../icons/fetch.svg";
import { Switch } from "@/app/components/shadcn/switch";
import { toast } from "sonner";
import { Markdown } from "@/app/components/markdown";
import { useState } from "react";
import { useMcpStore } from "@/app/store/mcp";

import { McpConfigKey, TDetailInfo } from "@/app/typing";

type Props = {
  setMode: (mode: McpConfigKey) => void;
  detailInfo: TDetailInfo;
};

const McpDetail: React.FC<Props> = ({ setMode, detailInfo }) => {
  const mcpStore = useMcpStore();
  const { switchMcpStatus } = mcpStore;
  const [checked, setChecked] = useState(detailInfo.checked);

  return (
    <>
      <div
        className="flex justify-between items-center mb-4 cursor-pointer w-max"
        onClick={() => setMode("table")}
      >
        <div className="flex items-center gap-2">
          <BackIcon className="size-6" />
          <span className="text-lg font-medium">MCP Details</span>
        </div>
      </div>

      <div className="border rounded-xl mt-6 overflow-y-auto max-h-[calc(100%-80px)] px-[20px] py-[24px]">
        <div className="header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#E8ECEF] rounded-sm flex items-center justify-center w-12 h-12">
              {detailInfo.mcp_logo ? (
                <img width="30" height="30" src={detailInfo.mcp_logo}></img>
              ) : (
                <FetchIcon className="w-[30px] h-[30px]" />
              )}
            </div>
            <div className="font-medium text-xl">{detailInfo.mcp_name}</div>
          </div>
          <div className="mt-4">
            <Switch
              checked={checked}
              onCheckedChange={async (enable) => {
                try {
                  setChecked(enable);
                  await switchMcpStatus({
                    id: detailInfo.mcp_id,
                    name: detailInfo.mcp_key,
                    enable: enable,
                    type: detailInfo.type,
                    version: detailInfo.current_version || "",
                  });
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
        <div className="mt-4 text-[#6C7275] text-sm leading-[24px]">
          {detailInfo.description}
        </div>
        {detailInfo.tutorial && (
          <div className="tutorial mt-6 border-t border-[#E8ECEF80] dark:border-[#2326274D] text-black dark:text-[#FFFFFF] pt-8">
            <Markdown content={detailInfo.tutorial || ""} />
          </div>
        )}
      </div>
    </>
  );
};

export default McpDetail;
