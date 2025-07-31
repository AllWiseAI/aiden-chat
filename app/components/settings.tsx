import { useState } from "react";
import CloseIcon from "../icons/close.svg";
import General from "./setting/general";
import McpManagement from "./setting/mcp-management";
import ModelList from "./setting/model-list";
import AboutUs from "./setting/about-us";
import { Button } from "@/app/components/shadcn/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import generalIcon from "../icons/general.svg";
import modelIcon from "../icons/model.svg";
import McpIcon from "../icons/mcp.svg";
import InfoIcon from "../icons/info.svg";

function GeneralPanel() {
  return <General />;
}
function ModelPanel() {
  return <ModelList />;
}
function McpServersPanel() {
  return <McpManagement />;
}
function AboutUsPanel() {
  return <AboutUs />;
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("settings");
  const settingList = [
    { name: t("tabs.general"), value: "general", icon: generalIcon },
    { name: t("tabs.model"), value: "model", icon: modelIcon },
    { name: t("tabs.mcp"), value: "mcp", icon: McpIcon },
    { name: t("tabs.aboutUs"), value: "about-us", icon: InfoIcon },
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
      case "mcp":
        return <McpServersPanel />;
      case "model":
        return <ModelPanel />;
      case "about-us":
        return <AboutUsPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col px-10 py-5 gap-5 h-full dark:bg-[#111214]"
      data-tauri-drag-region
    >
      <div className="flex justify-between items-center" data-tauri-drag-region>
        <div className="w-max text-lg dark:text-white font-semibold disable-select">
          {t("title")}
        </div>
        <Button
          variant="ghost"
          className="rounded-full size-6 bg-[#F3F5F7] dark:bg-[#6C7275] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75"
          onClick={() => navigate(-1)}
        >
          <CloseIcon className="size-4" />
        </Button>
      </div>
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="w-full h-[1px] bg-[#E8ECEF] dark:bg-[#232627]"></div>
        <div className="flex h-full">
          <ul
            className="w-max flex flex-col gap-2 min-w-40 border-r pt-2 pr-5"
            onClick={handleClick}
          >
            {settingList.map((item) => (
              <li
                key={item.value}
                data-value={item.value}
                className={`cursor-pointer select-none rounded-sm flex items-center text-[#6C7275] gap-3 px-1.5 py-2 ${
                  selected === item.value
                    ? "text-[#141718] bg-[#F3F5F7]/50 dark:text-white dark:bg-[#2326274D]"
                    : "hover:bg-[#F3F5F7]/50 dark:hover:text-white/60 dark:hover:bg-[#2326274D]"
                }`}
              >
                <item.icon className="size-4 flex-shrink-0" />
                <p className="font-medium text-sm">{item.name}</p>
              </li>
            ))}
          </ul>
          <div className="flex-1 pt-2 pl-5 h-full overflow-y-auto min-w-106">
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
