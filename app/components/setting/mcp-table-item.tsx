"use client";

import { Button } from "@/app/components/shadcn/button";
import { Switch } from "@/app/components/shadcn/switch";
import FetchIcon from "../../icons/fetch.svg";
import SuccessIcon from "../../icons/access.svg";
import LoadingIcon from "../../icons/loading-spinner.svg";
import ErrorIcon from "../../icons/error.svg";
import clsx from "clsx";
import { useEffect, useMemo, useCallback, useState } from "react";
import {
  McpItemInfo,
  McpAction,
  TSettingInfo,
  TTemplateInfo,
  CustomMCPServer,
} from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";
import { getFirstValue, parseTemplate } from "@/app/utils/mcp";
import { toast } from "sonner";
import { McpTemplateModal } from "./mcp-template-modal";

type McpItemProps = {
  keyword: string;
  item: McpItemInfo;
  onSwitchChange: (
    enable: boolean,
    id: string,
    name: string,
    aiden_type: string,
  ) => Promise<void>;
  onDelete: (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_name: string,
  ) => Promise<void>;
  onSelect: () => void;
  onSetting: (settingInfo: TSettingInfo | null, name: string) => void;
};

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  return text
    .split(new RegExp(`(${keyword})`, "gi"))
    .map((c, i) =>
      c.toLowerCase() === keyword.toLowerCase() ? <mark key={i}>{c}</mark> : c,
    );
}

export function McpTableItem({
  keyword,
  item,
  onSwitchChange,
  onDelete,
  onSelect,
  onSetting,
}: McpItemProps) {
  const [status, setStatus] = useState<McpAction | null>(null);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TTemplateInfo | null>(null);
  const StatusIcon = useMemo(() => {
    if (status === McpAction.Loading) return LoadingIcon;
    else if (status === McpAction.Connected) return SuccessIcon;
    else if (status === McpAction.Failed) return ErrorIcon;
    else return null;
  }, [status]);

  const showSetting = useMemo(() => {
    const { envs, args } = item.settingInfo || {};
    if (envs?.length || args?.length) {
      return true;
    }
    return false;
  }, [item]);

  const handleShowSettingModal = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onSetting(item.settingInfo, item.mcp_key);
    },
    [item.settingInfo, item.mcp_name, onSetting],
  );

  const {
    mcp_id,
    mcp_name,
    mcp_key,
    mcp_logo,
    description,
    checked = false,
    type,
  } = item;

  const { updateMcpStatusList, updateTemplate } = useMcpStore();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);
  const config = useMcpStore((state) => state.config);

  useEffect(() => {
    const current = mcpStatusList.find((item) => item.name === mcp_key);
    if (current) {
      setStatus(current.action);
    }
  }, [mcpStatusList]);

  const checkShowTemplateModal = useCallback(
    (enable: boolean) => {
      if (enable) {
        let templateInfo = null;
        if (config?.mcpServers[item.mcp_key]) {
          templateInfo = parseTemplate(config.mcpServers[item.mcp_key]);
        } else {
          const server = getFirstValue(item.basic_config || {});
          if (server) {
            templateInfo = parseTemplate(server as CustomMCPServer);
          }
        }
        if (templateInfo) {
          setTemplateInfo(templateInfo);
          const { templates, envs, multiArgs } = templateInfo;
          const emptyEnvs = envs.filter((env) => env.value === "");

          if (templates?.length || emptyEnvs?.length || multiArgs?.length) {
            setTemplateModal(true);
            return true;
          }
        }
      }
      return false;
    },
    [item, config],
  );

  const initLoading = () => {
    setStatus(McpAction.Loading);
    updateMcpStatusList(
      {
        name: item.mcp_key,
        action: McpAction.Loading,
      },
      "update",
    );
  };

  const handleCheckedChange = useCallback(
    async (enable: boolean) => {
      try {
        if (enable) {
          initLoading();
        }
        const needShowTemplateModal = checkShowTemplateModal(enable);
        if (needShowTemplateModal) return;
        await onSwitchChange(enable, mcp_id, mcp_key, type);
        console.log("[Mcp status change]: update remote config done");
      } catch (e: any) {
        toast.error(e, {
          className: "w-auto max-w-max",
        });
      }
    },
    [checkShowTemplateModal],
  );

  const handleCancelTemplateSetting = useCallback(async () => {
    initLoading();
    await onSwitchChange(true, mcp_id, mcp_key, type);
    console.log("[Mcp status change]: update remote config done");
  }, []);

  const handleSettingConfirm = async (templateInfo: TTemplateInfo) => {
    await updateTemplate(item.mcp_key, item.mcp_id, templateInfo);
    console.log("[Mcp status change]: update remote config done");
  };

  const showDelete = useMemo(() => {
    const { type } = item;
    return type === "custom";
  }, [item]);

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border p-4 cursor-pointer hover:bg-[#F3F5F74D] dark:hover:bg-[#232627]/30 transition-colors"
      key={mcp_id + mcp_key}
      onClick={onSelect}
    >
      <div className="flex items-top gap-4">
        <div className="w-12 h-12 flex-shrink-0 flex-center bg-[#E8ECEF] dark:bg-[#343839] rounded-lg relative">
          {mcp_logo ? (
            <img src={mcp_logo} width="30" height="30"></img>
          ) : (
            <FetchIcon className="w-[30px] h-[30px] text-[#343839] dark:text-[#6C7275]" />
          )}

          {checked && StatusIcon && (
            <StatusIcon
              className={clsx("absolute right-0 bottom-0 size-4", {
                "animate-spin text-main": status === McpAction.Loading,
              })}
            />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-base font-medium mb-1">
            {Highlight({ text: mcp_name, keyword })}
          </div>
          <div
            className="text-sm text-[#6C7275]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "24px",
              height: "72px",
            }}
          >
            {description || "No description"}
          </div>
        </div>
      </div>
      <div
        className={`flex mt-auto ${
          showDelete || showSetting
            ? "justify-between items-center"
            : "justify-end items-center"
        }`}
      >
        <div className="flex items-center gap-2">
          {showSetting && (
            <Button
              className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-[#00D47E] px-2.5"
              onClick={handleShowSettingModal}
            >
              Setting
            </Button>
          )}
          {showDelete && (
            <Button
              className="bg-[#EF466F]/6 hover:bg-[#EF466F]/20 text-[#EF466F] px-2.5"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                onDelete(e, mcp_key)
              }
            >
              Remove
            </Button>
          )}
        </div>
        <Switch
          id={mcp_id}
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(enable) => {
            handleCheckedChange(enable);
          }}
        />
      </div>
      {templateModal && templateInfo && (
        <McpTemplateModal
          onOpenChange={setTemplateModal}
          open={templateModal}
          templateInfo={templateInfo || {}}
          onCancel={handleCancelTemplateSetting}
          onConfirm={handleSettingConfirm}
        ></McpTemplateModal>
      )}
    </div>
  );
}
