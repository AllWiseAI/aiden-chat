import { open } from "@tauri-apps/plugin-shell";
import { exportAndDownloadLog } from "../../utils/log";
import Logo from "../../icons/aiden-logo.svg";
import config from "@/src-tauri/tauri.conf.json";
import RightIcon from "../../icons/right-arrow.svg";
import XIcon from "../../icons/X.svg";
import MediumIcon from "../../icons/medium.svg";
import DiscordIcon from "../../icons/discord.svg";
import LinkedInIcon from "../../icons/linkedin.svg";
import { getLang } from "../../locales";
import { useAppUpdate } from "@/app/hooks/use-app-update";
import { showConfirm } from "@/app/components/confirm-modal/confirm";
import { useTranslation } from "react-i18next";
import { track, EVENTS } from "@/app/utils/analysis";
import { useEffect } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/shadcn/accordion";

function Community() {
  const { t } = useTranslation("settings");
  const handleClick = (url: string) => {
    open(url);
  };
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border-t border-[#F3F5F7] dark:border-[#232627]/50"
    >
      <AccordionItem value="1" className="w-full">
        <AccordionTrigger className="p-4 hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 hover:no-underline">
          <div className="flex flex-row items-center">
            {t("aboutUs.community")}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div>
            <div
              className="text-[#6C7275] hover:text-[#141718] dark:text-[#6C7275] px-5.5 py-2.5 bg-[#FFFFFF] dark:bg-[#101213] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 hover:dark:text-[#FFFFFF] cursor-pointer "
              onClick={() => handleClick("https://x.com/AidentheAi")}
            >
              <div className="flex gap-2.5">
                <XIcon className="size-5" /> X
              </div>
            </div>

            <div
              className="text-[#6C7275] hover:text-[#141718] dark:text-[#6C7275] px-5.5 py-2.5 bg-[#FFFFFF] dark:bg-[#101213] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 hover:dark:text-[#FFFFFF] cursor-pointer"
              onClick={() => handleClick("https://medium.com/@AidenAI")}
            >
              <div className="flex gap-2.5">
                <MediumIcon className="size-5" /> Medium
              </div>
            </div>
            <div
              className="text-[#6C7275] hover:text-[#141718] dark:text-[#6C7275] px-5.5 py-2.5 bg-[#FFFFFF] dark:bg-[#101213] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 hover:dark:text-[#FFFFFF] cursor-pointer"
              onClick={() => handleClick("https://discord.gg/H2XczVjGJp")}
            >
              <div className="flex gap-2.5">
                <DiscordIcon className="size-5" /> Discord
              </div>
            </div>
            <div
              className="text-[#6C7275] hover:text-[#141718] dark:text-[#6C7275] px-5.5 py-2.5 bg-[#FFFFFF] dark:bg-[#101213] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 hover:dark:text-[#FFFFFF] cursor-pointer"
              onClick={() =>
                handleClick("https://www.linkedin.com/company/aidenagent")
              }
            >
              <div className="flex gap-2.5">
                <LinkedInIcon className="size-5" /> LinkedIn
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function AboutUs() {
  const { isShowUpdate, isLatest, handleUpdate, isUpdating } = useAppUpdate();
  const { t } = useTranslation("settings");
  const lang = getLang() === "zh-CN" ? "zh/" : "";

  useEffect(() => {
    track(EVENTS.SETTING_ABOUT_EXPOSURE);
  }, []);

  const aboutUsArr = [
    { name: t("aboutUs.export"), onClick: () => exportAndDownloadLog() },
    {
      name: isUpdating ? t("aboutUs.updating") : t("aboutUs.update"),
      onClick: () => {
        if (isUpdating) return;
        if (isLatest || !isShowUpdate) {
          showConfirm({
            title: "",
            description: `The current v${config.version} is already the latest version.`,
            type: "latestVersion",
            noClose: true,
            withLogo: true,
          });
          return;
        }
        handleUpdate();
      },
    },

    {
      name: t("aboutUs.terms"),
      onClick: () =>
        open(`https://docs.aidenai.io/${lang}terms-of-service.html`),
    },
    {
      name: t("aboutUs.privacy"),
      onClick: () => open(`https://docs.aidenai.io/${lang}privacy.html`),
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-137 min-w-70">
      <div className="flex gap-4">
        <Logo className="size-11" />
        <div className="flex flex-col justify-center font-medium">
          <div className="text-lg">{"v" + config.version}</div>
          <div className="text-xs text-[#6C7275] font-light">
            {t("aboutUs.contact")} contact@aidenai.io
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {aboutUsArr.map((item) => {
          return (
            <div
              key={item.name}
              onClick={item.onClick}
              className="group h-13 flex justify-between items-center hover:bg-[#F3F5F7] dark:hover:bg-[#232627]/50 px-4 py-2.5 cursor-pointer text-black dark:text-white text-sm border-t border-[#F3F5F7] dark:border-[#232627]/50"
            >
              {item.name}
              <RightIcon className="size-5 hidden group-hover:inline-block text-[#6C7275] dark:text-[#6C7275]" />
            </div>
          );
        })}
        <Community />
      </div>
    </div>
  );
}
