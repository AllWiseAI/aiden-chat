"use client";

import { Switch } from "@/app/components/shadcn/switch";
import FetchIcon from "../../icons/fetch.svg";
import MoreIcon from "../../icons/more.svg";
import SettingIcon from "../../icons/setting.svg";
import UpdateIcon from "../../icons/update.svg";
import DeleteIcon from "../../icons/delete.svg";
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
} from "@/app/typing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/shadcn/dropdown-menu";
import { useMcpStore } from "@/app/store/mcp";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { McpTemplateModal } from "./mcp-template-modal";
import { checkShowTemplateModal } from "@/app/utils/mcp";
import { McpOauthModal } from "./mcp-oauth-modal";

type McpItemProps = {
  keyword: string;
  item: McpItemInfo;
  onSwitchChange: (
    enable: boolean,
    id: string,
    name: string,
    aiden_type: string,
    version: string,
  ) => Promise<void>;
  onDelete: (
    e: React.MouseEvent<HTMLElement>,
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
  const { t, i18n } = useTranslation("settings");
  const [status, setStatus] = useState<McpAction | null>(null);
  const [templateModal, setTemplateModal] = useState(false);
  const [oauthModal, setOauthModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<TTemplateInfo | null>(null);
  const {
    mcp_id,
    mcp_name,
    mcp_key,
    mcp_logo,
    description,
    description_en,
    description_zh,
    checked = false,
    type,
    current_version,
    local_version,
    remote_version,
  } = item;

  const renderedDescription = useMemo(() => {
    if (i18n.language === "zh-CN" && description_zh) {
      return description_zh;
    } else if (i18n.language === "en-US" && description_en) {
      return description_en;
    }
    return description;
  }, [i18n.language, description, description_en, description_zh]);

  const { updateMcpStatusList, updateTemplate, updateLocalMcpVersion } =
    useMcpStore();
  const mcpStatusList = useMcpStore((state) => state.mcpStatusList);
  const config = useMcpStore((state) => state.config);
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

  const showOauth = useMemo(() => {
    const { mcp_key } = item;
    return mcp_key === "aiden-outlook";
  }, [item]);

  const showUpdate = useMemo(() => {
    if (!config?.mcpServers[mcp_key]) return false;
    if (!local_version && !remote_version) return false;
    if (local_version !== remote_version) {
      console.log(mcp_key, local_version, remote_version, config?.mcpServers);
      return true;
    }
    return false;
  }, [mcp_key, local_version, remote_version, config?.mcpServers]);

  const handleShowSettingModal = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onSetting(item.settingInfo, item.mcp_key);
    },
    [item.settingInfo, onSetting, item.mcp_key],
  );

  const handleShowOauthModal = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setOauthModal(true);
    },
    [],
  );

  const handleUpdateMcpVersion = useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const { mcp_id, mcp_key, current_version } = item;
      try {
        await updateLocalMcpVersion(mcp_id, mcp_key, current_version || "");
        toast.success(t("mcp.update.success"));
      } catch (e: any) {
        toast.error(e, {
          className: "w-auto max-w-max",
        });
      }
    },
    [item, updateLocalMcpVersion, t],
  );

  useEffect(() => {
    const current = mcpStatusList.find((item) => item.name === mcp_key);
    if (current) {
      setStatus(current.action);
    }
  }, [mcpStatusList, mcp_key]);

  const initLoading = useCallback(() => {
    setStatus(McpAction.Loading);
    updateMcpStatusList(
      {
        name: mcp_key,
        action: McpAction.Loading,
      },
      "update",
    );
  }, [mcp_key, updateMcpStatusList]);

  const handleCheckedChange = useCallback(
    async (enable: boolean) => {
      try {
        if (enable) {
          initLoading();
          const { shouldShowTemplateModal, templateInfo } =
            checkShowTemplateModal(config, item);
          setTemplateInfo(templateInfo);
          if (shouldShowTemplateModal) {
            setTemplateModal(true);
            return;
          }
        }
        await onSwitchChange(
          enable,
          mcp_id,
          mcp_key,
          type,
          current_version || "",
        );
        console.log("[Mcp status change]: update remote config done");
      } catch (e: any) {
        toast.error(e, {
          className: "w-auto max-w-max",
        });
      }
    },
    [
      config,
      item,
      onSwitchChange,
      mcp_id,
      mcp_key,
      type,
      initLoading,
      current_version,
    ],
  );

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
      className="w-full h-full flex flex-col gap-2.5 rounded-sm border border-[#E8ECEF] dark:border-[#232627] px-2.5 py-3 cursor-pointer hover:bg-[#F3F5F74D] dark:hover:bg-[#232627]/30 transition-colors mim-w-[207px] max-w-[336px]"
      key={mcp_id + mcp_key}
      onClick={onSelect}
    >
      <div className="flex items-top gap-4">
        <div className="w-[30px] h-[30px] flex-shrink-0 flex-center bg-[#E8ECEF] dark:bg-[#343839] rounded-full relative">
          {mcp_logo ? (
            <img src={mcp_logo} width="18" height="18"></img>
          ) : (
            <FetchIcon className="w-[18px] h-[18px] text-[#343839] dark:text-[#6C7275]" />
          )}

          {checked && StatusIcon && (
            <StatusIcon
              className={clsx("absolute right-0 bottom-0 size-2.5", {
                "animate-spin text-main": status === McpAction.Loading,
              })}
            />
          )}
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex justify-between">
            <div className="font-medium mb-1 w-full max-w-8/10">
              {Highlight({ text: mcp_name, keyword })}
            </div>
            {(showSetting || showUpdate || showDelete || showOauth) && (
              <DropdownMenu
                open={openMenu}
                onOpenChange={setOpenMenu}
                modal={false}
              >
                <DropdownMenuTrigger
                  className="size-4 flex-center cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  asChild
                  className="flex flex-col p-2 min-w-max"
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                  }}
                >
                  <DropdownMenuRadioGroup>
                    {showSetting && (
                      <DropdownMenuRadioItem
                        value="setting"
                        className="rounded-sm text-sm text-[#6C7275] px-1.5 py-2 h-9 gap-1.5"
                        onClick={handleShowSettingModal}
                      >
                        <SettingIcon className="size-[18px]" />
                        {t("mcp.setting")}
                      </DropdownMenuRadioItem>
                    )}
                    {showOauth && (
                      <DropdownMenuRadioItem
                        value="oauth"
                        className="rounded-sm text-sm text-[#6C7275] px-1.5 py-2 h-9 gap-1.5"
                        onClick={handleShowOauthModal}
                      >
                        {/* TODO replace oauth icon */}
                        <SettingIcon className="size-[18px]" />
                        {t("mcp.oauth")}
                      </DropdownMenuRadioItem>
                    )}
                    {showUpdate && (
                      <DropdownMenuRadioItem
                        value="update"
                        className="rounded-sm text-sm text-[#00AB66] px-1.5 py-2 h-9 gap-1.5"
                        onClick={handleUpdateMcpVersion}
                      >
                        <UpdateIcon className="size-[18px]" />
                        {t("mcp.btnUpdate")}
                      </DropdownMenuRadioItem>
                    )}
                    {showDelete && (
                      <DropdownMenuRadioItem
                        value="remove"
                        className="rounded-sm text-sm text-[#EF466F] px-1.5 py-2 h-9 gap-1.5"
                        onClick={(e: React.MouseEvent<HTMLElement>) =>
                          onDelete(e, mcp_key)
                        }
                      >
                        <DeleteIcon className="size-[18px]" />
                        {t("mcp.remove")}
                      </DropdownMenuRadioItem>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div
            className="text-xs text-[#6C7275]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "24px",
              height: "72px",
            }}
          >
            {renderedDescription || "No description"}
          </div>
        </div>
      </div>
      <div className="flex mt-auto justify-end items-center">
        <Switch
          className="scale-80"
          id={mcp_id}
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={handleCheckedChange}
        />
      </div>
      {templateModal && templateInfo && (
        <McpTemplateModal
          onOpenChange={setTemplateModal}
          open={templateModal}
          templateInfo={templateInfo || {}}
          onConfirm={handleSettingConfirm}
        ></McpTemplateModal>
      )}

      <McpOauthModal
        onOpenChange={setOauthModal}
        mcpInfo={item}
        open={oauthModal}
        onConfirm={() => setOauthModal(false)}
      ></McpOauthModal>
    </div>
  );
}
