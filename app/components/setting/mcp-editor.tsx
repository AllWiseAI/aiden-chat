"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/app/components/shadcn/button";
import { toast } from "sonner";
import { McpConfigKey } from "@/app/components/setting/type";
import BackIcon from "../../icons/back.svg";
import { useMcpStore } from "@/app/store/mcp";
import { json } from "@codemirror/lang-json";
import clsx from "clsx";
import TipsIcon from "../../icons/tips.svg";
import dynamic from "next/dynamic";
import { Theme } from "@/app/store";
import { useTheme } from "../../hooks/use-theme";
import { vscodeLight, vscodeDark } from "@uiw/codemirror-theme-vscode";
import { foldGutter, indentOnInput } from "@codemirror/language";
import { useTranslation } from "react-i18next";
import LoadingIcon from "../../icons/loading-spinner.svg";

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
  const theme = useTheme();
  const editorTheme = useMemo(() => {
    return theme === Theme.Dark ? vscodeDark : vscodeLight;
  }, [theme]);

  return (
    <div className="space-y-4 rounded-sm">
      <CodeMirror
        className={clsx("rounded-sm overflow-hidden", {
          "border border-[#EF466F]": error,
        })}
        value={jsonStr}
        height="calc(100vh - 180px)"
        extensions={[json(), foldGutter(), indentOnInput()]}
        theme={editorTheme}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
        }}
        onChange={setJsonStr}
      />
      {error && <p className="text-xs text-[#EF466F]">{error}</p>}
    </div>
  );
}

const McpEditor: React.FC<Props> = ({ setMode }) => {
  const mcpStore = useMcpStore();
  const { t } = useTranslation("settings");
  const { saveEditorConfig, getCleanedConfig } = mcpStore;
  const [jsonStr, setJsonStr] = useState<string>(JSON.stringify({}, null, 2));
  const cardObj = {
    mcpServers: {
      aiden_puppeteer: {
        args: ["-y", "@xxxxxxx", "run", "@xxxxxxx", "--key", "your key xxxxxx"],
        command: "/Users/name/.aiden/mpx",
      },
    },
  };
  useEffect(() => {
    const cleanedConfig = getCleanedConfig();
    setJsonStr(JSON.stringify(cleanedConfig, null, 2));
  }, []);

  const [error, setError] = useState<string>("");
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonStr);
      const res = await saveEditorConfig(parsed);
      if (res) {
        toast.success(t("mcp.editor.success"), {
          className: "w-auto max-w-max",
        });
        setMode("table");
      }
    } catch (e: any) {
      setError("JSON 解析错误：" + (e.message || e));
      toast.error(t("mcp.editor.fail"), {
        className: "w-auto max-w-max",
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-between items-center gap-1 w-max">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setMode("table")}
          >
            <BackIcon className="size-5" />
            <span className="text-sm font-medium">{t("mcp.edit")}</span>
          </div>
          <div
            className="relative"
            onMouseEnter={() => setShowCard(true)}
            onMouseLeave={() => setShowCard(false)}
          >
            <TipsIcon className="size-[18px]" />
            {showCard && (
              <div
                className="absolute z-1 left-0 top-5 bg-white dark:bg-[#101213] p-2.5 text-sm rounded-[4px]"
                style={{
                  boxShadow: `
                          0px 0px 24px 4px rgba(0,0,0,0.05),
                          0px 32px 48px -4px rgba(0,0,0,0.2)
                      `,
                }}
              >
                <pre>{JSON.stringify(cardObj, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] text-xs min-w-[54px] h-6 flex items-center gap-1 px-1.5 py-1"
        >
          {loading && <LoadingIcon className="size-3 animate-spin" />}
          {t("mcp.save")}
        </Button>
      </div>

      <ConfigEditor jsonStr={jsonStr} setJsonStr={setJsonStr} error={error} />
    </>
  );
};

export default McpEditor;
