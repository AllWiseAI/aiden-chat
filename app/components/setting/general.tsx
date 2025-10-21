import { useState, useEffect } from "react";
import {
  useAuthStore,
  // useSettingStore
} from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "@/app/utils/toast";
import { Path } from "../../constant";
import { Theme, useAppConfig } from "@/app/store";
import { useTranslation } from "react-i18next";
// import { relaunch } from "@tauri-apps/api/process";
import {
  getLang,
  changeLanguage,
  localeOptions,
  Locales,
  // countryList,
} from "../../locales";
import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/tooltip";
import { Switch } from "../shadcn/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/shadcn/select";
import { getRagEnabled, updateRagEnabled } from "../../services";
import LightMode from "../../icons/theme-light.svg";
import DarkMode from "../../icons/theme-dark.svg";
import SystemMode from "../../icons/theme-system.svg";
import InfoIcon from "../../icons/info.svg";
// import RestartDialog from "../restart-dialog";
import { track, EVENTS } from "@/app/utils/analysis";
import clsx from "clsx";

export default function General() {
  const authStore = useAuthStore();
  // const setRegion = useSettingStore((state) => state.setRegion);
  // const region = useSettingStore((state) => state.region);
  const config = useAppConfig();
  const { t } = useTranslation("settings");
  const updateConfig = config.update;
  const email = useAuthStore((state) => state.user.email);
  const navigate = useNavigate();
  // const [isAlertOpen, setIsAlertOpen] = useState(false);
  // const [currentRegion, setCurrentRegion] = useState<string>(region);
  const [theme, setTheme] = useState<Theme.Auto | Theme.Dark | Theme.Light>(
    config.theme,
  );

  const getRagStatus = async () => {
    const res = await getRagEnabled();
    const { data } = res;
    setRag(data.mcp_rag_enabled);
  };

  useEffect(() => {
    getRagStatus();
    track(EVENTS.SETTING_GENERAL_EXPOSURE);
  }, []);

  const [rag, setRag] = useState(false);
  const logout = async () => {
    navigate(Path.Login);
    try {
      const success = await authStore.logout();
      if (success) {
        toast.success("Logout success");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  // const handleRegionChange = async (value: string) => {
  //   setCurrentRegion(value);
  //   setIsAlertOpen(true);
  // };
  const handleChangeTheme = (value: Theme) => {
    setTheme(value);
    updateConfig((config) => {
      config.theme = value as Theme;
    });
  };
  // const sortedCountryList = [...countryList].sort((a, b) => {
  //   const nameA = t(`common:region.${a}`);
  //   const nameB = t(`common:region.${b}`);
  //   return nameA.localeCompare(nameB, "zh-CN", { sensitivity: "base" });
  // });
  return (
    <>
      <div className="w-max h-full pr-8 flex flex-col gap-10 justify-start items-start text-black dark:text-white">
        <div className="w-full flex flex-col gap-3 px-2.5 pt-1">
          <div className="font-medium">{t("general.account")}</div>
          <div className="w-full flex justify-between items-center gap-5 p-2.5 bg-[#F3F5F7]/30 dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-sm text-base">
            <p className="text-sm">{email}</p>
            <div className="flex items-center gap-5">
              <div
                className="text-[#EF466F] underline cursor-pointer hover:opacity-70"
                onClick={logout}
              >
                {t("general.logout")}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="w-full flex flex-col gap-3 justify-between px-2.5">
          <div className="font-medium">{t("general.country.title")}</div>
          <Select
            defaultValue={region || "US"}
            value={region}
            onValueChange={(value) => handleRegionChange(value)}
          >
            <SelectTrigger className="w-full dark:border-[#343839] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#F3F5F7] dark:bg-[#232627] max-w-full max-h-60 overflow-y-auto">
              <SelectGroup className="space-y-2">
                {sortedCountryList.map((region) => (
                  <SelectItem
                    key={region}
                    value={region}
                    className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
                  >
                    {t(`common:region.${region}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div> */}
        <div className="w-full flex flex-col justify-between gap-3 px-2.5">
          <div className="font-medium">{t("general.language")}</div>
          <Select
            defaultValue={getLang()}
            onValueChange={(value) => {
              changeLanguage(value as Locales);
            }}
          >
            <SelectTrigger className="w-full dark:border-[#343839] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full bg-[#F3F5F7] dark:bg-[#232627]">
              <SelectGroup className="space-y-2">
                {localeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col items-start gap-3 px-2.5 max-w-178">
          <div className="font-medium">{t("general.theme.title")}</div>
          <div className="flex justify-between gap-8 w-full text-sm">
            <div
              className={clsx(
                "flex flex-col gap-3 flex-1 p-4 bg-[#F3F5F7] dark:bg-[#232627] border-2 rounded-lg",
                theme === Theme.Light
                  ? "border-main"
                  : "border-[#F3F5F7] dark:border-[#232627]",
              )}
              onClick={() => handleChangeTheme(Theme.Light)}
            >
              <LightMode className="rounded-xl" />
              {t("general.theme.light")}
            </div>
            <div
              className={clsx(
                "flex flex-col gap-3 flex-1 p-4 bg-[#F3F5F7] dark:bg-[#232627] border-2 rounded-lg",
                theme === Theme.Dark
                  ? "border-main"
                  : "border-[#F3F5F7] dark:border-[#232627]",
              )}
              onClick={() => handleChangeTheme(Theme.Dark)}
            >
              <DarkMode className="rounded-xl" />
              {t("general.theme.dark")}
            </div>
            <div
              className={clsx(
                "flex flex-col gap-3 flex-1 p-4 bg-[#F3F5F7] dark:bg-[#232627] border-2 rounded-lg",
                theme === Theme.Auto
                  ? "border-main"
                  : "border-[#F3F5F7] dark:border-[#232627]",
              )}
              onClick={() => handleChangeTheme(Theme.Auto)}
            >
              <SystemMode className="rounded-xl" />
              {t("general.theme.system")}
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-3 px-2.5 w-full max-w-178">
          <div className="flex gap-4">
            <div className="font-medium">{t("general.rag.title")}</div>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="size-5 text-main stroke-[1.5]" />
              </TooltipTrigger>
              <TooltipContent
                hasArrow={false}
                sideOffset={10}
                className="max-w-80 w-max text-center p-5 text-sm leading-5"
                style={{
                  boxShadow: `
                          0px 0px 24px 4px rgba(0,0,0,0.05),
                          0px 32px 48px -4px rgba(0,0,0,0.2)
                      `,
                }}
              >
                <span>{t("general.rag.tip")}</span>
              </TooltipContent>
            </Tooltip>
          </div>

          <Switch
            checked={rag}
            onCheckedChange={async (checked) => {
              await updateRagEnabled(checked);
              setRag(checked);
            }}
          />
        </div>
        {/* <RestartDialog
          title={t("general.relaunch.title")}
          description={t("general.relaunch.description")}
          onConfirm={async () => {
            setRegion(currentRegion);
            setTimeout(() => {
              relaunch();
            }, 1000);
          }}
          onOpenChange={(value) => {
            if (!value) {
              setCurrentRegion(region);
            }
            setIsAlertOpen(value);
          }}
          isOpen={isAlertOpen}
        ></RestartDialog> */}
      </div>
    </>
  );
}
