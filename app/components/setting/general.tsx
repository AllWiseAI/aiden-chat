import { useAuthStore, useSettingStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Path } from "../../constant";
import { Theme, useAppConfig } from "@/app/store";
import { useTranslation } from "react-i18next";
import { relaunch } from "@tauri-apps/api/process";
import {
  getLang,
  changeLanguage,
  localeOptions,
  Locales,
  countryList,
} from "../../locales";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/shadcn/select";

export default function General() {
  const authStore = useAuthStore();
  const setRegion = useSettingStore((state) => state.setRegion);
  const region = useSettingStore((state) => state.region);
  const config = useAppConfig();
  const { t } = useTranslation("settings");
  const updateConfig = config.update;
  const email = useAuthStore((state) => state.user.email);
  const navigate = useNavigate();
  const logout = async () => {
    navigate(Path.Login);
    try {
      const success = await authStore.logout();
      if (success) {
        toast.success("Logout success", {
          className: "w-auto max-w-max",
        });
      }
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    }
  };
  const handleRegionChange = async (value: string) => {
    setRegion(value);
    setTimeout(async () => {
      await relaunch();
    }, 1000);
  };
  const sortedCountryList = [...countryList].sort((a, b) => {
    const nameA = t(`common:region.${a}`);
    const nameB = t(`common:region.${b}`);
    return nameA.localeCompare(nameB, "zh-CN", { sensitivity: "base" });
  });
  return (
    <div className="w-full h-full flex flex-col gap-4 justify-start items-center text-black dark:text-white">
      <div className="w-full flex flex-col gap-3 px-2.5 pb-5 border-b">
        <div className="font-medium">{t("general.account")}</div>
        <div className="flex justify-between items-center gap-5 p-2.5 bg-[#F3F5F7]/30 dark:bg-[#232627]/30 border border-[#E8ECEF] dark:border-[#232627] rounded-sm text-sm">
          <p>{email}</p>
          <div
            className="text-[#EF466F] text-xs underline cursor-pointer hover:opacity-70"
            onClick={logout}
          >
            {t("general.logout")}
          </div>
        </div>
      </div>
      <div className="w-full flex justify-between items-center gap-6 px-2.5 py-5 border-b">
        <div className="font-medium">{t("general.country.title")}</div>
        <Select
          defaultValue={region || "US"}
          onValueChange={(value) => handleRegionChange(value)}
        >
          <SelectTrigger className="w-[180px] dark:border-[#232627] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#F3F5F7] dark:bg-[#232627] max-w-[180px] max-h-60 overflow-y-auto">
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
      </div>
      <div className="w-full flex justify-between items-center gap-6 px-2.5 py-5 border-b">
        <div className="font-medium">{t("general.language")}</div>
        <Select
          defaultValue={getLang()}
          onValueChange={(value) => {
            changeLanguage(value as Locales);
          }}
        >
          <SelectTrigger className="w-[180px] dark:border-[#232627] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[180px] bg-[#F3F5F7] dark:bg-[#232627]">
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
      <div className="w-full flex justify-between items-center gap-6 px-2.5 py-5">
        <div className="font-medium">{t("general.theme.title")}</div>
        <Select
          defaultValue={config.theme}
          onValueChange={(value) => {
            updateConfig((config) => {
              config.theme = value as Theme;
            });
          }}
        >
          <SelectTrigger className="w-[180px] dark:border-[#232627] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[180px] bg-[#F3F5F7] dark:bg-[#232627]">
            <SelectGroup className="space-y-2">
              <SelectItem
                value="auto"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                {t("general.theme.system")}
              </SelectItem>
              <SelectItem
                value="light"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                {t("general.theme.light")}
              </SelectItem>
              <SelectItem
                value="dark"
                className="hover:!bg-[#E8ECEF] dark:hover:!bg-black"
              >
                {t("general.theme.dark")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
