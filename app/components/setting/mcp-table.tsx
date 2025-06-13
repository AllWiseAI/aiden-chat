"use client";
import { Button } from "@/app/components/shadcn/button";
import { Input } from "@/app/components/shadcn/input";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  showConfirm,
  ConfirmType,
} from "@/app/components/confirm-modal/confirm";
import { McpTableItem } from "./mcp-table-item";
import LoadingIcon from "../../icons/loading-spinner.svg";
import {
  McpItemInfo,
  McpConfigKey,
  TDetailInfo,
  TSettingInfo,
} from "@/app/typing";
import EditIcon from "../../icons/edit.svg";
import { useMcpStore } from "@/app/store/mcp";
import SearchIcon from "../../icons/search.svg";
import { McpSettingModal } from "./mcp-setting-modal";

type ServerTableProps = {
  keyword: string;
  servers: McpItemInfo[];
  switchMcpStatus: ({
    id,
    name,
    enable,
    type,
    version,
  }: {
    id: string;
    name: string;
    type: string;
    enable: boolean;
    version: string;
  }) => void;
  setDetail: (detailInfo: McpItemInfo) => void;
  removeMcpItem: (name: string) => void;
  setCurrentSetting: (
    settingInfo: TSettingInfo | null,
    mcpName: string,
  ) => void;
};

type Props = {
  setDetail: (detailInfo: TDetailInfo) => void;
  setMode: (mode: McpConfigKey) => void;
};

function ServerTable({
  keyword,
  setDetail,
  servers,
  removeMcpItem,
  switchMcpStatus,
  setCurrentSetting,
}: ServerTableProps) {
  const handleDeleteMcp = async (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_key: string,
  ) => {
    e.stopPropagation();
    let result = await showConfirm({
      title: "Delete",
      description: "Confirm to delete?",
      type: "delete",
    });
    if (result !== ConfirmType.Confirm) return;
    try {
      await removeMcpItem(mcp_key);
      toast.success("Deleted successfully");
    } catch (e) {
      toast.error("Failed to delete, please try again");
    }
  };
  return (
    <>
      {servers.length ? (
        <div className="grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] gap-5">
          {servers.map((item) => (
            <McpTableItem
              key={item.mcp_id + item.mcp_name}
              item={{ ...item }}
              keyword={keyword}
              onSwitchChange={async (enable, id, name, type, version) => {
                try {
                  await switchMcpStatus({ id, name, enable, type, version });
                } catch (e: any) {
                  toast.error(e, {
                    className: "w-auto max-w-max",
                  });
                }
              }}
              onDelete={handleDeleteMcp}
              onSelect={() => setDetail({ ...item })}
              onSetting={(settingInfo, name) =>
                setCurrentSetting(settingInfo, name)
              }
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex-center">
          {keyword ? (
            <div>No matches found</div>
          ) : (
            <LoadingIcon className="size-6 animate-spin text-main" />
          )}
        </div>
      )}
    </>
  );
}

const McpTable: React.FC<Props> = ({ setMode, setDetail }) => {
  const mcpStore = useMcpStore();
  const { t } = useTranslation("settings");
  const { switchMcpStatus, removeMcpItem, updateMcpArgsEnvs } = mcpStore;
  const [searchValue, setSearchValue] = useState("");
  const [showSettingModal, setShowSettingModal] = useState(false);
  const renderMcpList = useMcpStore((state) => state.renderMcpList);
  const [currentSetting, setCurrentSetting] = useState<TSettingInfo | null>(
    null,
  );
  const [currentMcpName, setCurrentMcpName] = useState<string>("");
  const handleSettingConfirm = async (update: TSettingInfo) => {
    setShowSettingModal(false);
    await updateMcpArgsEnvs(currentMcpName, update);
    toast.success("Updated successfully");
  };

  return (
    <>
      <div className="flex justify-between @lg:items-center mb-4 @max-lg:flex-col @max-lg:gap-2">
        <h2 className="text-lg font-bold">{t("tabs.mcp")}</h2>
        <div className="flex items-center gap-2 self-end">
          <Button
            className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main border border-[#00D47E]/10 font-medium text-sm rounded-xl"
            onClick={() => setMode("edit")}
          >
            <EditIcon className="size-4" />
            {t("mcp.edit")}
          </Button>
          <div className="flex-center relative w-[200px]">
            <Input
              className="h-9 !text-left !placeholder:text-[#6C7275]/50 placeholder:text-sm px-12 py-3.5 rounded-xl"
              clearable
              value={searchValue}
              placeholder={t("mcp.search")}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <SearchIcon className="absolute top-1/2 left-4 transform -translate-y-1/2 size-6 text-[#6C7275]/50" />
          </div>
        </div>
      </div>
      <div
        className="overflow-y-auto h-full"
        style={{ maxHeight: "calc(100% - 80px)" }}
      >
        <ServerTable
          servers={renderMcpList.filter((item) =>
            item.mcp_name.toLowerCase().includes(searchValue.toLowerCase()),
          )}
          keyword={searchValue}
          switchMcpStatus={switchMcpStatus}
          setDetail={setDetail}
          removeMcpItem={removeMcpItem}
          setCurrentSetting={(settingInfo, mcpName) => {
            setCurrentSetting(settingInfo);
            setCurrentMcpName(mcpName);
            setShowSettingModal(true);
          }}
        />
      </div>
      {showSettingModal && currentSetting && (
        <McpSettingModal
          onOpenChange={setShowSettingModal}
          open={showSettingModal}
          settingInfo={currentSetting}
          onConfirm={handleSettingConfirm}
        ></McpSettingModal>
      )}
    </>
  );
};

export default McpTable;
