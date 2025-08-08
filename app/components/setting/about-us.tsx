import { shell } from "@tauri-apps/api";
import { exportAndDownloadLog } from "../../utils/log";
import Logo from "../../icons/aiden-logo.svg";
import config from "@/src-tauri/tauri.conf.json";
import RightIcon from "../../icons/right-arrow.svg";
import { getLang } from "../../locales";
import { useAppUpdate } from "@/app/hooks/use-app-update";
import { showConfirm } from "@/app/components/confirm-modal/confirm";
import { useTranslation } from "react-i18next";

export default function AboutUs() {
  const { isShowUpdate, isLatest, handleUpdate, isUpdating } = useAppUpdate();
  const { t } = useTranslation("settings");
  const lang = getLang() === "zh-CN" ? "zh/" : "";

  const aboutUsArr = [
    { name: t("aboutUs.export"), onClick: () => exportAndDownloadLog() },
    {
      name: isUpdating ? t("aboutUs.updating") : t("aboutUs.update"),
      onClick: () => {
        if (isUpdating) return;
        if (isLatest || !isShowUpdate) {
          showConfirm({
            title: "",
            description: `The current v${config.package.version} is already the latest version.`,
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
        shell.open(`https://docs.aidenai.io/${lang}terms-of-service.html`),
    },
    {
      name: t("aboutUs.privacy"),
      onClick: () => shell.open(`https://docs.aidenai.io/${lang}privacy.html`),
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Logo className="size-12" />
        <div className="flex flex-col justify-center font-medium">
          <div className="text-lg">{"v" + config.package.version}</div>
          <div className="text-xs text-[#6C7275] font-light">
            {t("aboutUs.contact")} contact@allwise.com
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {aboutUsArr.map((item) => {
          return (
            <div
              key={item.name}
              onClick={item.onClick}
              className="group h-13 flex justify-between items-center hover:bg-[#E8ECEF] dark:hover:bg-[#232627]/50 px-4 py-2.5 cursor-pointer text-black dark:text-white text-sm border-t border-[#E8ECEF] dark:border-[#343839]/50"
            >
              {item.name}
              <RightIcon className="size-5 hidden group-hover:inline-block text-[#6C7275] dark:text-[#6C7275]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
