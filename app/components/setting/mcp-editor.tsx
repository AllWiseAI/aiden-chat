"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/app/components/shadcn/button";
import { toast } from "sonner";
import { McpConfigKey } from "@/app/components/setting/type";
import BackIcon from "../../icons/back.svg";
import { useMcpConfig } from "@/app/hooks/use-mcp-config";

import { json } from "@codemirror/lang-json";

import dynamic from "next/dynamic";
import { useAppConfig, Theme } from "@/app/store";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

type ConfigEditorProps = {
  jsonStr: string;
  setJsonStr: (val: string) => void;
  error: string;
};
type Props = {
  setMode: (mode: McpConfigKey) => void;
};

function ConfigEditor({ jsonStr, setJsonStr, error }: ConfigEditorProps) {
  const config = useAppConfig();
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = useMemo(() => {
    if (config.theme === Theme.Auto) {
      return mediaQuery.matches ? Theme.Dark : Theme.Light;
    } else return config.theme;
  }, [config.theme, mediaQuery]);

  return (
    <div className="space-y-4 mb-4 h-9/10">
      <CodeMirror
        className="border"
        value={jsonStr}
        height="400px"
        extensions={[json()]}
        theme={theme}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
        }}
        onChange={setJsonStr}
      />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

const McpEditor: React.FC<Props> = ({ setMode }) => {
  const { saveConfig, filteredServers } = useMcpConfig();
  const [jsonStr, setJsonStr] = useState<string>(
    JSON.stringify(filteredServers, null, 2),
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setJsonStr(JSON.stringify(filteredServers, null, 2));
  }, [filteredServers]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonStr);
      const res = await saveConfig(parsed);
      if (res) {
        toast.success("配置成功", {
          className: "w-auto max-w-max",
        });
        setMode("table");
      }
    } catch (e: any) {
      setError("JSON 解析错误：" + (e.message || e));
      toast.error("配置失败", {
        className: "w-auto max-w-max",
      });
      console.error(e);
    }
  };
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div
          className="flex justify-between items-center cursor-pointer w-max"
          onClick={() => setMode("table")}
        >
          <div className="flex items-center gap-2">
            <BackIcon className="size-6" />
            <span className="text-lg font-bold">Edit Config</span>
          </div>
        </div>
        <div className="flex">
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>

      <ConfigEditor jsonStr={jsonStr} setJsonStr={setJsonStr} error={error} />
    </>
  );
};

export default McpEditor;
