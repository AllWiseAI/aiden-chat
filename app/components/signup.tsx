import { Button } from "@/app/components/shadcn/button";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Checkbox } from "@/app/components/shadcn/checkbox";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store";
import { Password } from "./password";
import { apiGetSignUpCode } from "@/app/services";
import { Path } from "../constant";
import { toast } from "sonner";
import clsx from "clsx";
import { shell } from "@tauri-apps/api";
import { useTranslation } from "react-i18next";
import LoadingIcon from "../icons/loading-spinner.svg";

interface FormData {
  email: string;
  password: string;
  code: string;
  inviteCode: string;
}
interface SignUpFormProps {
  formData: FormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}
interface VerifyCodeFormProps {
  formData: FormData;
  onCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const SignUpForm = ({ formData, onFormChange, onSubmit }: SignUpFormProps) => {
  const { t } = useTranslation("auth");
  const [checked, setChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const validateEmail = (email: string) => {
    const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return reg.test(email);
  };
  const verifyPassword = (valA: string, valB: string) => {
    if (valA === valB) {
      setPasswordError("");
      return true;
    } else {
      setPasswordError(t("inValidPassword"));
      return false;
    }
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
    <>
      <div className="flex-center flex-col gap-4 text-black dark:text-white">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5" />
          <LogoTextIcon className="h-5.5" />
        </div>
        <span className="text-lg font-medium">{t("signUp.to")} Aiden.ai</span>
      </div>
      <form
        className="flex-center flex-col gap-5 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          const isValid = verifyPassword(formData.password, confirmPassword);
          if (!isValid) return;
          onSubmit(e);
        }}
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
                "border-2 border-[#EF466F]": emailError,
              },
            )}
            value={formData.email}
            onChange={onFormChange}
            onBlur={handleBlur}
            clearable
            required
          />
          {emailError && (
            <span className="text-xs text-red-500">{emailError}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="password"
            className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
          >
            {t("password")}
          </Label>

          <Password
            id="password"
            type="password"
            placeholder={t("enter")}
            className="!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 !rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
            value={formData.password}
            onChange={onFormChange}
            required
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="confirm-password"
            className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
          >
            {t("signUp.confirm")}
          </Label>

          <Password
            id="confirm-password"
            type="password"
            placeholder={t("signUp.confirmP")}
            className={clsx(
              "!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 !rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
              { "border-2 border-[#EF466F]": passwordError },
            )}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordError) {
                verifyPassword(formData.password, e.target.value);
              }
            }}
            required
          />
          {passwordError && (
            <span className="text-sm text-red-500">{passwordError}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="inviteCode"
            className="font-normal after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
          >
            {t("signUp.invite")}
          </Label>

          <Input
            id="inviteCode"
            type="text"
            placeholder={t("signUp.enterInviteCode")}
            className={clsx(
              "!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 !rounded-sm text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
            )}
            value={formData.inviteCode}
            onChange={onFormChange}
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
          type="submit"
          className="w-full h-11 !px-2.5 !py-2 bg-main hover:bg-[#009A5C] disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] text-white text-sm dark:text-black font-medium rounded-sm"
          disabled={
            !(
              formData.email &&
              formData.password &&
              confirmPassword &&
              formData.inviteCode &&
              checked
            ) || !!emailError
          }
        >
          {t("signUp.btn")}
        </Button>
      </form>
      <span className="text-xs text-[#777E90] font-medium">
        {t("signUp.has")}{" "}
        <Link to={Path.Login} className="underline text-main">
          {t("signIn.btn")}
        </Link>
      </span>
    </>
  );
};

const VerifyCodeForm = ({
  formData,
  onCodeChange,
  onSubmit,
  loading,
}: VerifyCodeFormProps) => {
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const getCode = async (email: string) => {
    try {
      const res = (await apiGetSignUpCode({ email }).catch((err) => {
        throw new Error(err);
      })) as any;
      if ("error" in res) {
        throw new Error(res.error);
      }
      toast.success(res.message, {
        className: "w-auto max-w-max",
      });
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    }
  };

  const handleGetCode = () => {
    if (countdown > 0) return;

    getCode(formData.email);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
  };
  return (
    <>
      <div className="flex-center flex-col gap-5">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5" />
          <LogoTextIcon className="h-5.5" />
        </div>
        <span className="text-lg font-medium">{t("signUp.verifyAddress")}</span>
      </div>
      <form
        className="w-full h-full flex flex-col justify-start items-center gap-8"
        onSubmit={onSubmit}
      >
        <div className="w-full flex flex-col gap-2.5">
          <span className="text-[#777E90] dark:text-[#6C7275] text-sm">
            {t("email")}
          </span>
          <div className="w-full h-9 flex gap-2 bg-[#F3F5F7]/50 dark:bg-[#141718] border-2 border-[#E8ECEF] dark:border-[#232627] px-2.5 py-2 rounded-sm text-sm font-normal">
            <span className="text-[#141416] dark:text-white">
              {formData.email}
            </span>
          </div>
          <span className="text-center text-xs text-[#777E90] dark:text-[#6C7275]">
            {t("signUp.tip")}
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <Input
            id="code"
            className="h-9 w-full pl-2.5 pr-22 py-2 rounded-sm text-sm placeholder:text-[#777E90] !text-left hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
            placeholder={t("enterCode")}
            value={formData.code}
            onChange={onCodeChange}
          />
          <Button
            onClick={handleGetCode}
            type="button"
            variant="ghost"
            disabled={countdown > 0}
            className="absolute right-2 top-1/2 h-6 px-1 !py-0 transform -translate-y-1/2 bg-transparent text-main text-sm font-medium rounded-xs hover:text-main transition-colors disabled:text-main disabled:font-medium disabled:opacity-100 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}s` : t("getCode")}
          </Button>
        </div>

        <div className="w-full flex flex-col gap-5">
          <Button
            type="submit"
            disabled={!formData.code || loading}
            className="w-full h-11 font-medium text-sm rounded-sm bg-main disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] hover:bg-[#02C174]/90 px-2.5 py-2"
          >
            {loading && <LoadingIcon className="size-4 animate-spin" />}
            {t("signUp.verify")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium text-sm rounded-sm px-2.5 py-2"
            onClick={() => navigate(-1)}
          >
            {t("back")}
          </Button>
        </div>
      </form>
    </>
  );
};

export function SignUpPage() {
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
    inviteCode: "",
  });
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const success = await authStore.signup(
        formData.code,
        formData.email,
        formData.password,
        formData.inviteCode,
        "",
      );
      if (success) {
        navigate(Path.Chat);
        toast.success(t("signUp.success"), {
          className: "w-auto max-w-max",
        });
      }
    } catch (e: any) {
      toast.error(e.message, {
        className: "w-auto max-w-max",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const filteredValue =
      id === "name" ? value.trim() : value.replace(/\s/g, "");
    setFormData((data) => ({
      ...data,
      [id]: filteredValue,
    }));
  };
  return (
    <div className="w-full h-full px-6 py-13 my-10 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center gap-[50px] rounded-2xl">
      {isSignUp ? (
        <SignUpForm
          formData={formData}
          onFormChange={handleChange}
          onSubmit={() => setIsSignUp(false)}
        />
      ) : (
        <VerifyCodeForm
          formData={formData}
          onCodeChange={handleChange}
          onSubmit={handleVerifyCode}
          loading={loading}
        />
      )}
    </div>
  );
}
