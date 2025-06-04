"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/app/components/shadcn/button";
import { toast } from "sonner";
import { McpConfigKey } from "@/app/components/setting/type";
import BackIcon from "../../icons/back.svg";
import { useMcpStore } from "@/app/store/mcp";
import { json } from "@codemirror/lang-json";
import dynamic from "next/dynamic";
import { useAppConfig, Theme } from "@/app/store";
import { vscodeLight, vscodeDark } from "@uiw/codemirror-theme-vscode";
import { foldGutter, indentOnInput } from "@codemirror/language";

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
      return mediaQuery.matches ? vscodeDark : vscodeLight;
    } else if (config.theme === Theme.Light) return vscodeLight;
    else if (config.theme === Theme.Dark) return vscodeDark;
  }, [config.theme, mediaQuery]);

  return (
    <div className="space-y-4 rounded-lg overflow-hidden">
      <CodeMirror
        className=""
        value={jsonStr}
        height="calc(100vh - 200px)"
        extensions={[json(), foldGutter(), indentOnInput()]}
        theme={theme}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
        }}
        onChange={setJsonStr}
      />
      {error && <p className="text-[#EF466F]">{error}</p>}
    </div>
  );
}

const McpEditor: React.FC<Props> = ({ setMode }) => {
  const mcpStore = useMcpStore();
  const { saveEditorConfig, getCleanedConfig } = mcpStore;
  const [jsonStr, setJsonStr] = useState<string>(JSON.stringify({}, null, 2));
  useEffect(() => {
    const cleanedConfig = getCleanedConfig();
    setJsonStr(JSON.stringify(cleanedConfig, null, 2));
  }, []);

  const [error, setError] = useState<string>("");

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonStr);
      const res = await saveEditorConfig(parsed);
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
            <span className="text-lg font-medium">Edit Config</span>
          </div>
        </div>
        <div className="flex">
          <Button
            onClick={handleSave}
            className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] w-[54px]"
          >
            Save
          </Button>
        </div>
      </div>

      <ConfigEditor jsonStr={jsonStr} setJsonStr={setJsonStr} error={error} />
    </>
  );
};

export default McpEditor;
