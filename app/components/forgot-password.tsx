import { Button } from "@/app/components/shadcn/button";
import { Label } from "@/app/components/shadcn/label";
import { Input } from "@/app/components/shadcn/input";
import { Password } from "@/app/components/password";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Path } from "../constant";
import { apiCompleteResetPassword, apiResetPasswordCode } from "@/app/services";
import { toast } from "sonner";
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
          className="font-bold after:content['*'] after:content-['*'] after:text-red-500 !gap-1"
        >
          {t("email")}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="mail@aiden.com"
          className={clsx("w-full h-13 !text-left px-4 py-3.5", {
            "border-2 border-[#EF466F]": emailError,
          })}
          value={formData.email}
          onChange={onEmailChange}
          onBlur={handleBlur}
          clearable
          required
        />
        {emailError && (
          <span className="text-xs text-red-500">{emailError}</span>
        )}
      </div>
      <Button
        className="w-full h-12 !px-6 !py-3 bg-main hover:bg-[#02C174]/90 text-white dark:text-black font-semibold rounded-full"
        type="submit"
        disabled={!formData.email || !!emailError}
      >
        {t("forgot.next")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 font-semibold rounded-full px-6 py-4 dark:border-[#777E90]"
        onClick={() => navigate(-1)}
      >
        {t("back")}
      </Button>
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
      toast.success(res.message, {
        className: "w-auto max-w-max",
      });
    } catch (e: any) {
      if (e.message.includes("Network Error")) {
        toast.error(t("netErr"), {
          className: "w-auto max-w-max",
        });
      } else {
        toast.error(e.message, {
          className: "w-auto max-w-max",
        });
      }
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

  const verifyPassword = () => {
    if (formData.password === confirmPassword) {
      setPasswordError("");
    } else setPasswordError(t("inValidPassword"));
  };

  return (
    <form
      className="w-full h-full flex-center flex-col gap-8"
      onSubmit={onSubmit}
    >
      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex flex-col gap-2 bg-[#F3F5F7] dark:bg-[#141718] border-2 border-[#E8ECEF] dark:border-[#232627] px-4 py-3.5 rounded-xl font-bold">
          <span className="text-[#777E90] text-sm dark:text-[#6C7275]">
            {t("email")}
          </span>
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
          className="!w-full h-12 !max-w-130 !text-left !px-4 !py-3.5"
          value={formData.password}
          onChange={onFormChange}
          required
        />

        <Password
          id="confirm-password"
          type="password"
          placeholder={t("forgot.confirm")}
          className="!w-full h-12 !max-w-130 !text-left !px-4 !py-3.5"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
          }}
          onBlur={verifyPassword}
          required
        />
        {passwordError && (
          <span className="text-xs text-red-500">{passwordError}</span>
        )}
        <div className="relative w-full">
          <Input
            id="code"
            className="bg-[#F3F5F7] h-12 w-full pl-4 pr-32 py-3.5 rounded-xl placeholder:text-[#777E90] placeholder:font-medium font-medium !text-left"
            placeholder={t("enterCode")}
            value={formData.code}
            onChange={onFormChange}
          />
          <Button
            onClick={handleGetCode}
            type="button"
            variant="ghost"
            disabled={countdown > 0}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-main text-sm font-medium rounded-lg hover:bg-gray-200 hover:text-main transition-colors disabled:text-main disabled:font-medium disabled:opacity-100 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}s` : t("getCode")}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={
          !formData.code || !formData.password || !confirmPassword || loading
        }
        className="w-full h-12 font-semibold rounded-full bg-main text-white dark:text-black hover:bg-[#02C174]/90 px-6 py-4"
      >
        {t("forgot.reset")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 font-semibold rounded-full px-6 py-4"
        onClick={() => navigate(-1)}
      >
        {t("back")}
      </Button>
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
      toast.success(res.message, {
        className: "w-auto max-w-max",
      });
      navigate(Path.Login);
    } catch (e: any) {
      if (e.message.includes("Network Error")) {
        toast.error(t("netErr"), {
          className: "w-auto max-w-max",
        });
      } else {
        toast.error(e.message, {
          className: "w-auto max-w-max",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-10 my-10 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center gap-8 rounded-2xl">
      <div className="flex-center flex-col gap-4">
        <LogoTextIcon className="text-black dark:text-white" />
        <span className="text-2xl font-medium">{t("forgot.title")}</span>
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
