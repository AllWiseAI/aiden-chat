"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/shadcn/button";
import { toast } from "sonner";

import BackIcon from "../../icons/back.svg";

import { useMcpConfig } from "@/app/hooks/use-mcp-config";
import { searchMcpServerStatus } from "@/app/services";
import { delay } from "@/app/utils";
// import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

import dynamic from "next/dynamic";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

enum McpAction {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
}

type MCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
  aiden_type?: string;
  aiden_enable?: boolean;
};

type McpConfigKey = "table" | "edit" | "detail";
type ConfigEditorProps = {
  servers: Record<string, MCPServer>;
  onSave: (newServers: Record<string, MCPServer>) => void;
};
type Props = {
  setMode: (mode: McpConfigKey) => void;
};

function ConfigEditor({ servers, onSave }: ConfigEditorProps) {
  const [jsonStr, setJsonStr] = useState(() =>
    JSON.stringify(servers, null, 2),
  );

  useEffect(() => {
    if (servers) {
      setJsonStr(JSON.stringify(servers, null, 2));
    }
  }, [servers]);

  const [error, setError] = useState("");

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonStr);
      onSave(parsed);
    } catch (e: any) {
      setError("JSON 解析错误：" + e.message);
    }
  };

  return (
    <div className="space-y-4 mb-4 h-9/10">
      <CodeMirror
        className="border"
        value={jsonStr}
        height="400px"
        extensions={[json()]}
        theme="light"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
        }}
        onChange={setJsonStr}
      />
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}

const McpEditor: React.FC<Props> = ({ setMode }) => {
  const { setStatusMap, saveConfig, filteredServers } = useMcpConfig();
  return (
    <>
      <div
        className="flex justify-between items-center mb-4 cursor-pointer w-max"
        onClick={() => setMode("table")}
      >
        <div className="flex items-center gap-2">
          <BackIcon className="size-6" />
          <span className="text-lg font-bold">Edit Config</span>
        </div>
      </div>
      <ConfigEditor
        servers={filteredServers}
        onSave={async (servers) => {
          try {
            JSON.stringify(servers, null, 2);
            const res = await saveConfig(servers);
            console.log("===res", res);
            if (res) {
              toast.success("配置成功", {
                className: "w-auto max-w-max",
              });
              setMode("table");
            }
          } catch (e) {
            toast.error("配置失败", {
              className: "w-auto max-w-max",
            });
            console.error(e);
          }
          const configNames = Object.keys(servers);
          await Promise.all(
            configNames.map(async (name) => {
              try {
                setStatusMap((m) => ({
                  ...m,
                  [name]: McpAction.Connecting,
                }));
                await delay(1000);
                const { data } = (await searchMcpServerStatus(name)) as any;
                setStatusMap((m) => ({
                  ...m,
                  [name]: data?.status || McpAction.Disconnected,
                }));
              } catch {
                setStatusMap((m) => ({
                  ...m,
                  [name]: McpAction.Disconnected,
                }));
              }
            }),
          );
        }}
      />
    </>
  );
};

export default McpEditor;
