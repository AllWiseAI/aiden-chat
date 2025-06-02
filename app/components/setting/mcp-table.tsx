"use client";

import { Button } from "@/app/components/shadcn/button";
import { toast } from "sonner";
import { useMcpConfig } from "@/app/hooks/use-mcp-config";
import {
  showConfirm,
  ConfirmType,
} from "@/app/components/confirm-modal/confirm";
import { McpTableItem } from "./mcp-table-item";
import LoadingIcon from "../../icons/loading-spinner.svg";
import EditIcon from "../../icons/edit.svg";
import { McpItemInfo, McpConfigKey, TDetailInfo } from "@/app/typing";

type ServerTableProps = {
  servers: McpItemInfo[];
  disabledList: string[];
  switchDisable: (mcp_id: string, mcp_name: string, enable: boolean) => void;
  setDetail: (detailInfo: McpItemInfo) => void;
  delMcpItem: (mcp_id: string, mcp_name: string) => void;
};

type Props = {
  setDetail: (detailInfo: TDetailInfo) => void;
  setMode: (mode: McpConfigKey) => void;
};

function ServerTable({
  setDetail,
  servers,
  switchDisable,
  delMcpItem,
}: ServerTableProps) {
  const handleDeleteMcp = async (
    e: React.MouseEvent<HTMLButtonElement>,
    mcp_id: string,
    mcp_name: string,
  ) => {
    e.stopPropagation();
    let result = await showConfirm({
      title: "Delete",
      description: "Confirm to delete?",
      type: "delete",
    });
    if (result !== ConfirmType.Confirm) return;
    try {
      await delMcpItem(mcp_id, mcp_name);
      toast.success("Delete Successfully");
    } catch (e) {
      toast.error("Delete Failed");
    }
  };
  return (
    <>
      {servers.length ? (
        <div className="grid grid-cols-2 gap-5">
          {servers.map((item) => (
            <McpTableItem
              key={item.mcp_id + item.mcp_name}
              item={{ ...item }}
              onSwitchChange={async (enable, id, name) => {
                try {
                  await switchDisable(id, name, enable);
                  toast.success("切换成功", {
                    className: "w-auto max-w-max",
                  });
                } catch (e: any) {
                  toast.error(e, {
                    className: "w-auto max-w-max",
                  });
                }
              }}
              onDelete={handleDeleteMcp}
              onSelect={() => setDetail({ ...item })}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex-center">
          <LoadingIcon className="size-6 animate-spin text-main" />
        </div>
      )}
    </>
  );
}

const McpTable: React.FC<Props> = ({ setMode, setDetail }) => {
  const { disableList, switchDisable, mcpItemsList, delMcpItem } =
    useMcpConfig();

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">MCP Management</h2>
        <Button
          className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main border border-[#00D47E]/10 font-medium text-sm rounded-xl"
          onClick={() => setMode("edit")}
        >
          <EditIcon className="size-4" />
          Edit Config
        </Button>
      </div>
      <div
        className="overflow-y-auto h-full"
        style={{ maxHeight: "calc(100% - 80px)" }}
      >
        <ServerTable
          servers={mcpItemsList}
          disabledList={disableList}
          switchDisable={switchDisable}
          setDetail={setDetail}
          delMcpItem={delMcpItem}
        />
      </div>
    </>
  );
};

export default McpTable;
