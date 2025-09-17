import { Button } from "@/app/components/shadcn/button";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Password } from "@/app/components/password";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Path } from "../constant";
import { apiCompleteResetPassword, apiResetPasswordCode } from "@/app/services";
import { toast } from "@/app/utils/toast";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

interface FormData {
  email: string;
  password: string;
  code: string;
}

interface EmailFormProps {
  formData: FormData;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface ResetPasswordProps {
  formData: FormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

function EmailInput({ formData, onEmailChange, onSubmit }: EmailFormProps) {
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError(t("inValidEmail"));
      return;
    }
    onSubmit(e);
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
    <form className="flex-center flex-col gap-8 w-full" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 w-full">
        <Label
          htmlFor="email"
          className="font-bold after:content['*'] after:content-['*'] after:text-red-500 !gap-1 text-sm"
        >
          {t("email")}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="mail@aiden.com"
          className={clsx(
            "w-full h-9 !text-left px-2.5 py-2 text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
            {
              "border-2 border-[#EF466F]": emailError,
            },
          )}
          value={formData.email}
          onChange={onEmailChange}
          onBlur={handleBlur}
          clearable
          required
        />
        {emailError && (
          <span className="text-sm text-red-500">{emailError}</span>
        )}
      </div>
      <div className="w-full flex flex-col gap-5">
        <Button
          className="w-full h-11 !px-6 !py-3 bg-main hover:bg-[#02C174]/90 disabled:bg-[#7FD5B2] dark:disabled:bg-[#0A6E45] text-white dark:text-black font-semibold rounded-sm"
          type="submit"
          disabled={!formData.email || !!emailError}
        >
          {t("forgot.next")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-semibold rounded-sm px-6 py-4 dark:border-[#777E90]"
          onClick={() => navigate(-1)}
        >
          {t("back")}
        </Button>
      </div>
    </form>
  );
}

const ResetPassword = ({
  formData,
  onFormChange,
  onSubmit,
  loading,
}: ResetPasswordProps) => {
  const [countdown, setCountdown] = useState(0);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const getCode = async (email: string) => {
    try {
      const res = (await apiResetPasswordCode(email).catch((err) => {
        throw new Error(err);
      })) as any;
      if ("error" in res) {
        throw new Error(res.error);
      }
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message);
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

  const verifyPassword = (valA: string, valB: string) => {
    if (valA === valB) {
      setPasswordError("");
      return true;
    } else {
      setPasswordError(t("inValidPassword"));
      return false;
    }
  };

  return (
    <form
      className="w-full flex-center flex-col gap-8"
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        const isValid = verifyPassword(formData.password, confirmPassword);
        if (!isValid) return;
        onSubmit(e);
      }}
    >
      <div className="w-full flex flex-col gap-4">
        <span className="text-[#777E90] text-sm dark:text-[#6C7275]">
          {t("email")}
        </span>
        <div className="w-full flex gap-2 bg-[#F3F5F7]/50 dark:bg-[#141718] border-2 border-[#E8ECEF] dark:border-[#232627] px-2.5 py-2 rounded-sm text-sm">
          <span className="text-[#141416] dark:text-white">
            {formData.email}
          </span>
        </div>
        {/* <span className="text-center text-sm font-medium text-[#777E90]">
          Please enter the 6-digit verification code sent to your email.
        </span> */}

        <Password
          id="password"
          type="password"
          placeholder={t("forgot.enter")}
          className={clsx(
            "!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
            passwordError && "border-[#EF466F]",
          )}
          value={formData.password}
          onChange={(e) => {
            onFormChange(e);
            if (passwordError) {
              verifyPassword(e.target.value, confirmPassword);
            }
          }}
          required
        />

        <Password
          id="confirm-password"
          type="password"
          placeholder={t("forgot.confirm")}
          className={clsx(
            "!w-full h-9 !max-w-130 !text-left !px-2.5 !py-2 text-sm hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]",
            passwordError && "border-[#EF466F]",
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
          <span className="text-xs text-[#EF466F] font-light">
            {passwordError}
          </span>
        )}
        <div className="relative w-full overflow-hidden">
          <Input
            id="code"
            className="h-9 w-full pl-2.5 pr-22 py-2 rounded-sm text-sm !text-left hover:border-[#6C7275] focus:border-[#00AB66] dark:hover:border-[#E8ECEF] dark:focus:border-[#00AB66]"
            placeholder={t("enterCode")}
            value={formData.code}
            onChange={onFormChange}
          />
          <Button
            onClick={handleGetCode}
            type="button"
            variant="ghost"
            disabled={countdown > 0}
            className="absolute right-2 h-6 top-1/2 px-1 !py-0 transform -translate-y-1/2 bg-transparent text-main text-sm font-medium rounded-lg hover:text-main transition-colors disabled:text-main disabled:font-medium disabled:opacity-100 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}s` : t("getCode")}
          </Button>
        </div>
      </div>
      <div className="w-full flex flex-col gap-5">
        <Button
          type="submit"
          disabled={
            !formData.code || !formData.password || !confirmPassword || loading
          }
          className="w-full h-11 text-sm rounded-sm bg-main text-white dark:text-black hover:bg-[#02C174]/90 px-2.5 py-2"
        >
          {t("forgot.reset")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-sm rounded-sm px-2.5 py-2 border border-[#E8ECEF] dark:border-[#343839]"
          onClick={() => navigate(-1)}
        >
          {t("back")}
        </Button>
      </div>
    </form>
  );
};

export const ForgotPasswordPage = () => {
  const [isEmailForm, setIsEmailForm] = useState(true);
  const [formData, setFormData] = useState({
    email: localStorage.getItem("user-email") || "",
    password: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const filteredValue = value.replace(/\s/g, "");
    setFormData((data) => ({
      ...data,
      [id]: filteredValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = (await apiCompleteResetPassword(formData).catch((err) => {
        throw new Error(err);
      })) as any;
      if ("error" in res) {
        throw new Error(res.error);
      }
      toast.success(res.message);
      navigate(Path.Login);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full px-6 py-13 my-10 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center gap-17.5 rounded-2xl">
      <div className="flex-center flex-col gap-4">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5 text-[#00D47E]" />
          <LogoTextIcon className="h-5.5" />
        </div>
        <span className="text-lg font-medium">{t("forgot.title")}</span>
      </div>
      {isEmailForm ? (
        <EmailInput
          formData={formData}
          onEmailChange={handleChange}
          onSubmit={() => setIsEmailForm(false)}
        />
      ) : (
        <ResetPassword
          formData={formData}
          onFormChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
};
