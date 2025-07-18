"use client";

import BackIcon from "../../icons/back.svg";
import FetchIcon from "../../icons/fetch.svg";
import { Switch } from "@/app/components/shadcn/switch";
import { toast } from "sonner";
import { Markdown } from "@/app/components/markdown";
import { useState, useMemo, useCallback } from "react";
import { useMcpStore } from "@/app/store/mcp";
import { useTranslation } from "react-i18next";
import { checkShowTemplateModal } from "@/app/utils/mcp";

import { McpConfigKey, McpItemInfo, TTemplateInfo } from "@/app/typing";
import { McpTemplateModal } from "./mcp-template-modal";

type Props = {
  setMode: (mode: McpConfigKey) => void;
  detailInfo: McpItemInfo;
};

const McpDetail: React.FC<Props> = ({ setMode, detailInfo }) => {
  const mcpStore = useMcpStore();
  const config = useMcpStore((state) => state.config);
  const { switchMcpStatus } = mcpStore;
  const [checked, setChecked] = useState(detailInfo.checked);
  const { t, i18n } = useTranslation("settings");
  const [templateModal, setTemplateModal] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TTemplateInfo | null>(null);

  const {
    description,
    description_en,
    description_zh,
    tutorial,
    tutorial_en,
    tutorial_zh,
  } = detailInfo;

  const renderedDescription = useMemo(() => {
    if (i18n.language === "zh-CN" && description_zh) {
      return description_zh;
    } else if (i18n.language === "en-US" && description_en) {
      return description_en;
    }
    return description;
  }, [i18n.language, description, description_en, description_zh]);

  const renderedTutorial = useMemo(() => {
    if (i18n.language === "zh-CN" && tutorial_zh) {
      return tutorial_zh;
    } else if (i18n.language === "en-US" && tutorial_en) {
      return tutorial_en;
    }
    return tutorial;
  }, [i18n, tutorial, tutorial_en, tutorial_zh]);

  const resolveSwitchChange = useCallback(
    async (enable: boolean) => {
      try {
        setChecked(enable);
        await switchMcpStatus({
          id: detailInfo.mcp_id,
          name: detailInfo.mcp_key,
          enable: enable,
          type: detailInfo.type,
          version: detailInfo.current_version || "",
        });
        toast.success(t("mcp.update.success"));
      } catch (e: any) {
        toast.error(e, {
          className: "w-auto max-w-max",
        });
        setChecked(!enable);
      }
    },
    [detailInfo, switchMcpStatus, t],
  );

  const handleSwitchChange = useCallback(
    async (enable: boolean) => {
      if (enable) {
        const { shouldShowTemplateModal, templateInfo } =
          checkShowTemplateModal(config, detailInfo);
        setTemplateInfo(templateInfo);
        if (shouldShowTemplateModal) {
          setTemplateModal(true);
          return;
        } else {
          resolveSwitchChange(enable);
        }
      } else {
        resolveSwitchChange(enable);
      }
    },
    [detailInfo, config, resolveSwitchChange],
  );

  const handleSettingConfirm = useCallback(
    async (templateInfo: TTemplateInfo) => {
      setChecked(true);
      try {
        await mcpStore.updateTemplate(
          detailInfo.mcp_key,
          detailInfo.mcp_id,
          templateInfo,
        );
        console.log("[Mcp status change]: update remote config done");
        toast.success(t("mcp.update.success"));
      } catch (e: any) {
        setChecked(false);
        toast.error(e);
        console.error(e);
      }
    },
    [detailInfo, mcpStore, t],
  );

  return (
    <>
      <div
        className="flex justify-between items-center mb-4 cursor-pointer w-max"
        onClick={() => setMode("table")}
      >
        <div className="flex items-center gap-1">
          <BackIcon className="size-5" />
          <span className="text-sm font-medium">MCP Details</span>
        </div>
      </div>

      <div className="border rounded-xl mt-6 overflow-y-auto max-h-[calc(100%-80px)] px-[20px] py-[24px]">
        <div className="header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#E8ECEF] rounded-full flex items-center justify-center w-[30px] h-[30px]">
              {detailInfo.mcp_logo ? (
                <img width="18" height="18" src={detailInfo.mcp_logo}></img>
              ) : (
                <FetchIcon className="w-[18px] h-[18px]" />
              )}
            </div>
            <div className="font-medium text-sm">{detailInfo.mcp_name}</div>
          </div>
          <div className="mt-1">
            <Switch
              className="scale-75"
              checked={checked}
              onCheckedChange={handleSwitchChange}
            />
          </div>
        </div>
        <div className="mt-4 text-[#6C7275] text-sm leading-[24px]">
          {renderedDescription}
        </div>
        {detailInfo.tutorial && (
          <div className="tutorial mt-6 border-t border-[#E8ECEF80] dark:border-[#2326274D] text-black dark:text-[#FFFFFF] pt-8">
            <Markdown content={renderedTutorial || ""} />
          </div>
        )}
      </div>
      {templateModal && templateInfo && (
        <McpTemplateModal
          onOpenChange={setTemplateModal}
          open={templateModal}
          templateInfo={templateInfo || {}}
          onConfirm={handleSettingConfirm}
        ></McpTemplateModal>
      )}
    </>
  );
};

export default McpDetail;
