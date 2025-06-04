"use client";
import { Button } from "@/app/components/shadcn/button";
import { Input } from "@/app/components/shadcn/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  showConfirm,
  ConfirmType,
} from "@/app/components/confirm-modal/confirm";
import { McpTableItem } from "./mcp-table-item";
import LoadingIcon from "../../icons/loading-spinner.svg";
import EditIcon from "../../icons/edit.svg";
import { McpItemInfo, McpConfigKey, TDetailInfo } from "@/app/typing";
import { useMcpStore } from "@/app/store/mcp";
import SearchIcon from "../../icons/search.svg";

type ServerTableProps = {
  keyword: string;
  servers: McpItemInfo[];
  switchMcpStatus: ({
    id,
    name,
    enable,
    type,
  }: {
    id: string;
    name: string;
    type: string;
    enable: boolean;
  }) => void;
  setDetail: (detailInfo: McpItemInfo) => void;
  removeMcpItem: (name: string) => void;
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
}: ServerTableProps) {
  const handleDeleteMcp = async (
    e: React.MouseEvent<HTMLButtonElement>,
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
      await removeMcpItem(mcp_name);
      toast.success("Delete Successfully");
    } catch (e) {
      toast.error("Delete Failed");
    }
  };
  return (
    <>
      {servers.length ? (
        <div className="grid @xss:grid-cols-2 @sm:grid-cols-3 @headerMd:grid-cols-4 gap-5">
          {servers.map((item) => (
            <McpTableItem
              key={item.mcp_id + item.mcp_name}
              item={{ ...item }}
              keyword={keyword}
              onSwitchChange={async (enable, id, name, type) => {
                try {
                  await switchMcpStatus({ id, name, enable, type });
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
  const { switchMcpStatus, removeMcpItem } = mcpStore;
  const [searchValue, setSearchValue] = useState("");
  const renderMcpList = useMcpStore((state) => state.renderMcpList);

  return (
    <>
      <div className="flex justify-between @lg:items-center mb-4 @max-lg:flex-col @max-lg:gap-2">
        <h2 className="text-lg font-bold">MCP Management</h2>
        <div className="flex items-center gap-2 self-end">
          <Button
            className="bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main border border-[#00D47E]/10 font-medium text-sm rounded-xl"
            onClick={() => setMode("edit")}
          >
            <EditIcon className="size-4" />
            Edit Config
          </Button>
          <div className="flex-center relative w-[200px]">
            <Input
              className="h-9 !text-left !placeholder:text-[#6C7275]/50 placeholder:text-sm px-12 py-3.5 rounded-xl"
              clearable
              value={searchValue}
              placeholder="Search"
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
        />
      </div>
    </>
  );
};

export default McpTable;
