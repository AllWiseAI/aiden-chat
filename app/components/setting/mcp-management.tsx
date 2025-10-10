"use client";

import { useEffect, useState } from "react";
import { useMcpStore } from "@/app/store/mcp";

import McpTable from "./mcp-table";
import McpDetail from "./mcp-detail";
import McpEditor from "./mcp-editor";

import { McpConfigKey, McpItemInfo } from "@/app/typing";
import { track, EVENTS } from "@/app/utils/analysis";

export default function McpConfig() {
  const mcpStore = useMcpStore();
  const config = useMcpStore((state) => state.config);
  const [mode, setMode] = useState<McpConfigKey>("table");
  const [detailInfo, setDetailInfo] = useState<McpItemInfo>();
  const handleSetDetail = (detailInfo: McpItemInfo) => {
    setMode("detail");
    setDetailInfo(detailInfo);
  };

  useEffect(() => {
    mcpStore.reCaculateMcpList();
    track(EVENTS.SETTING_MCP_EXPOSURE);
  }, []);

  if (!config) {
    return <div className="p-4 text-gray-600">Loading...</div>;
  }

  return (
    <div className="h-full text-black dark:text-white @container">
      <div className={mode === "table" ? "block h-full @container" : "hidden"}>
        <McpTable setMode={setMode} setDetail={handleSetDetail} />
      </div>

      {mode === "edit" && <McpEditor setMode={setMode} />}
      {mode === "detail" && detailInfo && (
        <McpDetail setMode={setMode} detailInfo={detailInfo} />
      )}
    </div>
  );
}
