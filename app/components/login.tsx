import { Button } from "@/app/components/shadcn/button";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Checkbox } from "@/app/components/shadcn/checkbox";
import { Password } from "@/app/components/password";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Path } from "../constant";
import { useAuthStore, useSettingStore } from "../store";
import { toast } from "sonner";
import clsx from "clsx";
import { shell } from "@tauri-apps/api";
import LoadingIcon from "../icons/loading-spinner.svg";
import { useTranslation } from "react-i18next";
import { appDataInit } from "../utils/init";

export function LoginPage() {
  const getRegion = useSettingStore((state) => state.getRegion);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [formData, setFormData] = useState({
    email: localStorage.getItem("user-email") || "",
    password: "",
  });
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError(t("inValidEmail"));
      return;
    }
    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        appDataInit();
        navigate(Path.Chat);
        toast.success(t("signIn.success"), {
          className: "w-auto max-w-max",
        });
        localStorage.setItem("user-email", formData.email);
      }
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    } finally {
      setLoading(false);
    }
    getRegion();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const filteredValue = value.replace(/\s/g, "");

    setFormData((data) => ({
      ...data,
      [id]: filteredValue,
    }));
  };
  const validateEmail = (email: string) => {
    const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return reg.test(email);
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "email" && value && !validateEmail(value)) {
      setEmailError(t("inValidEmail"));
    } else {
      setEmailError("");
    }
  };
  return (
    <div className="w-full h-full px-6 py-13 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center gap-12 rounded-2xl">
      <div className="flex-center flex-col gap-4 text-black dark:text-white">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5" />
          <LogoTextIcon className="h-5.5" />
        </div>

        <span className="text-lg font-medium">{t("signIn.to")} Aiden.ai</span>
      </div>
      <form
        className="flex-center flex-col gap-5 w-full"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="email"
            className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
          >
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="mail@aiden.com"
            className={clsx(
              "w-full h-9 !text-left px-2.5 py-2 rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
              {
                "border border-[#EF466F]": emailError,
              },
            )}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            clearable
            required
          />
          {emailError && (
            <span className="text-[10px] text-red-500">{emailError}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between">
            <Label
              htmlFor="password"
              className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
            >
              {t("password")}
            </Label>
            <Link
              to={Path.ForgotPassword}
              className="text-xs text-main font-medium underline"
            >
              {t("signIn.forgot")}
            </Link>
          </div>

          <Password
            id="password"
            type="password"
            placeholder={t("enter")}
            className="!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 !rounded-sm text-sm border hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="self-start flex items-center gap-2 text-xs">
          <Checkbox
            className="!size-[14px] !border-[#6C7275] !rounded-xs cursor-pointer"
            checked={checked}
            onCheckedChange={(val) => {
              if (val !== "indeterminate") {
                setChecked(val);
              }
            }}
          />
          <div>
            {t("agree")}{" "}
            <span
              className="cursor-pointer text-main underline"
              onClick={() =>
                shell.open("https://docs.aidenai.io/terms-of-service.html")
              }
            >
              {t("terms")}
            </span>
            {" " + t("and") + " "}
            <span
              className="cursor-pointer text-main underline"
              onClick={() => shell.open("https://docs.aidenai.io/privacy.html")}
            >
              {t("privacy")}
            </span>
          </div>
        </div>
        <Button
          className="w-full h-11 !px-2.5 !py-2 bg-main hover:bg-[#009A5C] disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] text-white text-base dark:text-black font-medium rounded-sm"
          type="submit"
          disabled={
            !(formData.email && formData.password && checked) ||
            loading ||
            !!emailError
          }
        >
          {loading && <LoadingIcon className="size-4 animate-spin" />}
          {t("signIn.btn")}
        </Button>
      </form>
      <span className="text-xs text-[#777E90]">
        {t("signIn.noAccount")}{" "}
        <Link to={Path.SignUp} className="underline text-main">
          {t("signUp.btn")}
        </Link>
      </span>
    </div>
  );
}
