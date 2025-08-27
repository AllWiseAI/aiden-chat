import { Button } from "@/app/components/shadcn/button";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Checkbox } from "@/app/components/shadcn/checkbox";
import { Password } from "@/app/components/password";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Path } from "../constant";
import { useAuthStore, useSettingStore } from "../store";
import { toast } from "sonner";
import clsx from "clsx";
import { shell } from "@tauri-apps/api";
import LoadingIcon from "../icons/loading-spinner.svg";
import { getLang } from "../locales";
import { useTranslation } from "react-i18next";
import { appDataInit } from "../utils/init";
import { apiGetCaptcha } from "../services";

export function LoginPage() {
  const getRegion = useSettingStore((state) => state.getRegion);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const lang = getLang() === "zh-CN" ? "zh/" : "";
  const { t } = useTranslation("auth");
  const [formData, setFormData] = useState({
    email: localStorage.getItem("user-email") || "",
    password: "",
    captchaId: "",
    captchaAnswer: "",
  });
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    email: string;
    password: string;
    captcha: string;
  }>({
    email: "",
    password: "",
    captcha: "",
  });
  const [captcha, setCaptcha] = useState<{
    captcha_id: string;
    captcha_image: string;
    expires_at: number;
  }>({
    captcha_id: "",
    captcha_image: "",
    expires_at: Date.now(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({
      email: "",
      password: "",
      captcha: "",
    });
    if (formData.email && !validateEmail(formData.email)) {
      setError((error) => ({ ...error, email: t("inValidEmail") }));
      return;
    }
    setLoading(true);

    try {
      const success = await login(
        formData.email,
        formData.password,
        formData.captchaId,
        formData.captchaAnswer,
      );
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
      if (e.code === "INVALID_CAPTCHA") {
        setError((error) => ({ ...error, captcha: e.message }));
      } else if (e.code === "INVALID_PASSWORD") {
        setError((error) => ({ ...error, password: e.message }));
      }
    } finally {
      setLoading(false);
      getCaptcha();
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
    if (id === "password") {
      setError((error) => ({ ...error, password: "" }));
    } else if (id === "capchaAnwser") {
      setError((error) => ({ ...error, captcha: "" }));
    }
  };

  const getCaptcha = async () => {
    const res = (await apiGetCaptcha()) as {
      captcha_id: string;
      captcha_image: string;
      expires_at: number;
    };
    const { captcha_id, captcha_image, expires_at } = res;
    setFormData((data) => ({
      ...data,
      captchaId: captcha_id,
    }));

    setCaptcha({
      ...captcha,
      captcha_id,
      captcha_image: `data:image/png;base64,${captcha_image}`,
      expires_at,
    });
  };

  useEffect(() => {
    getCaptcha();
  }, []);

  const validateEmail = (email: string) => {
    const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return reg.test(email);
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "email" && value && !validateEmail(value)) {
      setError((error) => ({ ...error, email: t("inValidEmail") }));
    } else {
      setError((error) => ({ ...error, email: "" }));
    }
  };
  return (
    <div className="w-full h-full px-6 py-13 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center gap-12 rounded-2xl">
      <div className="flex-center flex-col gap-4 text-black dark:text-white">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5 text-[#00D47E]" />
          <LogoTextIcon className="h-5.5" />
        </div>

        <span className="text-lg font-medium">{t("signIn.to")}</span>
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
                "border-[#EF466F] dark:border-[#EF466F]": error.email,
              },
            )}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            clearable
            required
          />
          {error.email && (
            <span className="text-[10px] text-red-500">{error.email}</span>
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
            className={clsx(
              "!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 !rounded-sm text-sm border hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
              {
                "border-[#EF466F] dark:border-[#EF466F]": error.password,
              },
            )}
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error.password && (
            <span className="text-[10px] text-red-500">{error.password}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="captchaAnswer"
            className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
          >
            Captcha
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                id="captchaAnswer"
                type="text"
                placeholder="Enter captcha"
                className={clsx(
                  "w-full h-9 !text-left px-2.5 py-2 rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
                  {
                    "border-[#EF466F] dark:border-[#EF466F]": error.captcha,
                  },
                )}
                value={formData.captchaAnswer}
                onChange={handleChange}
              />
            </div>

            <img
              src={captcha.captcha_image}
              alt=""
              className="w-30 h-10 cursor-pointer border rounded"
              onClick={getCaptcha}
            ></img>
          </div>
          {error.captcha && (
            <span className="text-[10px] text-red-500">{error.captcha}</span>
          )}
        </div>
        <div className="self-start flex items-center gap-2 text-xs">
          <Checkbox
            className={clsx(
              "!size-[14px] !rounded-xs cursor-pointer",
              checked ? "border-0 bg-sky-400" : "border-[#6C7275]",
            )}
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
                shell.open(
                  `https://docs.aidenai.io/${lang}terms-of-service.html`,
                )
              }
            >
              {t("terms")}
            </span>
            {" " + t("and") + " "}
            <span
              className="cursor-pointer text-main underline"
              onClick={() =>
                shell.open(`https://docs.aidenai.io/${lang}privacy.html`)
              }
            >
              {t("privacy")}
            </span>
          </div>
        </div>
        <Button
          className="w-full h-11 !px-2.5 !py-2 bg-main hover:bg-[#009A5C] disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] text-white text-base dark:text-black font-medium rounded-sm"
          type="submit"
          disabled={
            !(
              formData.email &&
              formData.password &&
              formData.captchaAnswer &&
              checked
            ) ||
            loading ||
            !!error.email
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
