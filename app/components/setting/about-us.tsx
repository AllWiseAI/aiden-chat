import { shell } from "@tauri-apps/api";
import { exportAndDownloadLog } from "../../utils/log";
import Logo from "../../icons/aiden-logo.svg";
import config from "@/src-tauri/tauri.conf.json";
import RightIcon from "../../icons/right-arrow.svg";
import { useAppUpdate } from "@/app/hooks/use-app-update";
import { showConfirm } from "@/app/components/confirm-modal/confirm";
import { useTranslation } from "react-i18next";

export default function AboutUs() {
  const { isShowUpdate, isLatest, handleUpdate, isUpdating } = useAppUpdate();
  const { t } = useTranslation("settings");
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
      onClick: () => shell.open("https://aidenai.io/terms-of-service.html"),
    },
    {
      name: t("aboutUs.privacy"),
      onClick: () => shell.open("https://aidenai.io/privacy.html"),
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Logo className="size-12" />
        <div className="flex flex-col gap-1 justify-center font-medium">
          <div className="text-sm">{"v" + config.package.version}</div>
          <div className="text-[10px] text-[#6C7275]">
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
              <RightIcon className="hidden group-hover:inline-block" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
