import { useState } from "react";
import CloseIcon from "../icons/close.svg";
import General from "./setting/general";
import McpManagement from "./setting/mcp-management";
import AboutUs from "./setting/about-us";
import { Button } from "@/app/components/shadcn/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import generalIcon from "../icons/general.svg";
import McpIcon from "../icons/mcp.svg";
import InfoIcon from "../icons/info.svg";

function GeneralPanel() {
  return <General />;
}
function ConnectedAppsPanel() {
  return <div>这是 Connected Apps 设置面板</div>;
}
function McpServersPanel() {
  return <McpManagement />;
}
function AboutUsPanel() {
  return <AboutUs />;
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const settingList = [
    { name: "General", value: "general", icon: generalIcon },
    // { name: "Connected Apps", value: "connected-app"},
    { name: "MCP Management", value: "mcp", icon: McpIcon },
    { name: "About us", value: "about-us", icon: InfoIcon },
  ];

  const [selected, setSelected] = useState<string>(
    searchParams.get("tab") ?? settingList[0].value,
  );
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    const li = target.closest("li");
    if (!li) return;
    const v = li.dataset.value;
    if (v) setSelected(v);
  };

  const renderPanel = () => {
    switch (selected) {
      case "general":
        return <GeneralPanel />;
      case "connected-app":
        return <ConnectedAppsPanel />;
      case "mcp":
        return <McpServersPanel />;
      case "about-us":
        return <AboutUsPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col p-5 gap-5 h-full dark:bg-[#141718]"
      data-tauri-drag-region
    >
      <div className="flex justify-between items-center">
        <div className="w-max text-xl dark:text-white font-semibold disable-select">
          Settings
        </div>
        <Button
          variant="ghost"
          className="rounded-full size-8 bg-[#F3F5F7] dark:bg-[#6C7275] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75"
          onClick={() => navigate(-1)}
        >
          <CloseIcon className="size-4" />
        </Button>
      </div>
      <div className="h-full">
        <div className="w-full h-[1px] bg-[#E8ECEF] dark:bg-[#232627]"></div>
        <div className="flex h-full">
          <ul
            className="w-max flex flex-col gap-2 min-w-40 border-r pt-5 pr-5"
            onClick={handleClick}
          >
            {settingList.map((item) => (
              <li
                key={item.value}
                data-value={item.value}
                className={`cursor-pointer select-none rounded-xl flex items-center text-[#6C7275] gap-3 px-4 py-2 ${
                  selected === item.value
                    ? "text-[#141718] bg-[#E8ECEF4D] dark:text-white dark:bg-[#2326274D]"
                    : "hover:bg-[#E8ECEF4D] dark:hover:text-white/60 dark:hover:bg-[#2326274D]"
                }`}
              >
                <item.icon className="size-4 flex-shrink-0" />
                <p className="font-normal text-sm">{item.name}</p>
              </li>
            ))}
          </ul>
          <div className="flex-1 p-4 h-full min-w-100">{renderPanel()}</div>
        </div>
      </div>
    </div>
  );
}
