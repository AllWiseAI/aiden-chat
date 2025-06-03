"use client";

import { useState } from "react";
import { useMcpStore } from "@/app/store/mcp";

import McpTable from "./mcp-table";
import McpDetail from "./mcp-detail";
import McpEditor from "./mcp-editor";

import { McpConfigKey, TDetailInfo } from "@/app/typing";

export default function McpConfig() {
  const config = useMcpStore((state) => state.config);
  const [mode, setMode] = useState<McpConfigKey>("table");
  const [detailInfo, setDetailInfo] = useState<TDetailInfo>();
  const handleSetDetail = (detailInfo: TDetailInfo) => {
    setMode("detail");
    setDetailInfo(detailInfo);
  };

  if (!config) {
    return <div className="p-4 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-4 h-full text-black dark:text-white">
      {mode === "table" && (
        <McpTable setMode={setMode} setDetail={handleSetDetail} />
      )}

      {mode === "edit" && <McpEditor setMode={setMode} />}
      {mode === "detail" && detailInfo && (
        <McpDetail setMode={setMode} detailInfo={detailInfo} />
      )}
    </div>
  );
}
