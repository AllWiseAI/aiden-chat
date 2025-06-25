import i18n from "i18next";
import common from "./en-US/common.json";

export const locales = ["en-US", "zh-CN"] as const;

export type Locales = (typeof locales)[number];

type LocaleOptions = {
  label: string;
  value: Locales;
}[];

export const localeOptions: LocaleOptions = [
  {
    label: "English",
    value: "en-US",
  },
  {
    label: "简体中文",
    value: "zh-CN",
  },
] as LocaleOptions;

export const getLang = (): Locales => {
  return (i18n.language as Locales) || "en-US";
};

export const changeLanguage = (lang: Locales) => {
  i18n.changeLanguage(lang);
};

export const countryList = Object.keys(common.region);
