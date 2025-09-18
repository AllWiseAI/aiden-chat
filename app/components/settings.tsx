import { useState, useRef } from "react";
import CloseIcon from "../icons/close.svg";
import General from "./setting/general";
import AgentManagement from "./agent-management";
import McpManagement from "./setting/mcp-management";
import ModelList from "./setting/model-list";
import Subscription from "./setting/subscription";
import AboutUs from "./setting/about-us";
import clsx from "clsx";
import { Button } from "@/app/components/shadcn/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import generalIcon from "../icons/general.svg";
import AgentIcon from "../icons/agent.svg";
import modelIcon from "../icons/model.svg";
import McpIcon from "../icons/mcp.svg";
import SubscriptionIcon from "../icons/subscription.svg";
import InfoIcon from "../icons/info.svg";

function GeneralPanel() {
  return <General />;
}
function AgentPanel() {
  return <AgentManagement />;
}
function ModelPanel() {
  return <ModelList />;
}
function McpServersPanel() {
  return <McpManagement />;
}
function SubscriptionPanel() {
  return <Subscription />;
}
function AboutUsPanel() {
  return <AboutUs />;
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("settings");
  const settingList = [
    { name: t("tabs.general"), value: "general", icon: generalIcon },
    { name: t("tabs.agent"), value: "agent", icon: AgentIcon },
    { name: t("tabs.model"), value: "model", icon: modelIcon },
    { name: t("tabs.mcp"), value: "mcp", icon: McpIcon },
    {
      name: t("tabs.subscription"),
      value: "subscription",
      icon: SubscriptionIcon,
    },
    { name: t("tabs.aboutUs"), value: "about-us", icon: InfoIcon },
  ];

  const [selected, setSelected] = useState<string>(
    searchParams.get("tab") ?? settingList[0].value,
  );
  const navigate = useNavigate();
  const renderPanelRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    const li = target.closest("li");
    if (!li) return;
    const v = li.dataset.value;
    if (v) {
      setSelected(v);
      if (renderPanelRef.current && selected !== v) {
        renderPanelRef.current.scrollTop = 0;
      }
    }
  };

  const renderPanel = () => {
    switch (selected) {
      case "general":
        return <GeneralPanel />;
      case "agent":
        return <AgentPanel />;
      case "mcp":
        return <McpServersPanel />;
      case "model":
        return <ModelPanel />;
      case "subscription":
        return <SubscriptionPanel />;
      case "about-us":
        return <AboutUsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-[#F3F5F7] dark:bg-[#141718] h-screen">
      <div
        className="flex justify-between items-center h-15 px-5 border-b border-[#E8ECEF] dark:border-[#232627]/50"
        data-tauri-drag-region
      >
        <div className="w-max text-lg dark:text-white font-semibold disable-select">
          {t("title")}
        </div>
        <Button
          variant="ghost"
          className="rounded-full size-6 bg-[#F3F5F7] dark:bg-[#232627] hover:bg-[#F3F5F7]/75 dark:hover:bg-[#6C7275]/75"
          onClick={() => navigate(-1)}
        >
          <CloseIcon className="size-4 text-[#343839] dark:text-white" />
        </Button>
      </div>
      <div className="h-full overflow-y-hidden">
        <div className="flex flex-col h-full">
          <div className="flex h-full">
            <ul
              className="w-max flex flex-col gap-3.5 min-w-60 border-r dark:border-[#232627]/50 p-4"
              onClick={handleClick}
            >
              {settingList.map((item) => (
                <li
                  key={item.value}
                  data-value={item.value}
                  className={`cursor-pointer select-none rounded-sm flex items-center text-[#6C7275] gap-3 px-1.5 py-2 ${
                    selected === item.value
                      ? "text-[#141718] bg-[#E8ECEF] dark:text-white dark:bg-[#232627] font-medium"
                      : "hover:bg-[#F3F5F7]/50 dark:hover:text-white/60 dark:hover:bg-[#232627]"
                  }`}
                >
                  <item.icon
                    className={clsx(
                      "size-4 shrink-0",
                      selected === item.value
                        ? "stroke-[1.5]"
                        : "stroke-[1.13]",
                    )}
                  />
                  <p className="text-sm">{item.name}</p>
                </li>
              ))}
            </ul>
            <div
              ref={renderPanelRef}
              className="flex-1 px-15 py-12.5 h-full overflow-y-auto  bg-[#FEFEFE] dark:bg-[#101213]"
            >
              {renderPanel()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
