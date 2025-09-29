import { Button } from "@/app/components/shadcn/button";
import { googleLogin, googleLoginStatus } from "../services";
import { useState } from "react";
import { Divider } from "../components/divider";
import { useAuthStore } from "../store";
import { useTranslation } from "react-i18next";
import { appDataInit } from "../utils/init";
import GoogleLoginIcon from "@/app/icons/google-login.svg";
import { useNavigate } from "react-router-dom";
import { shell } from "@tauri-apps/api";
import { toast } from "@/app/utils/toast";
import LoadingIcon from "../icons/loading-spinner.svg";
import { Path } from "../constant";
import { GoogleLoginResponse, GoogleStatusResponse } from "../typing";

export function GoogleAuth({ type = "signin" }: { type: "signin" | "signup" }) {
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
  const setLoginInfo = useAuthStore((state) => state.setLoginInfo);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  async function pollLoginStatus(session_id: string): Promise<any> {
    const interval = 5000;

    while (true) {
      try {
        const loginStatus: GoogleStatusResponse = await googleLoginStatus({
          session_id,
        });
        console.log("[pollLoginStatus] 当前状态:", loginStatus.status);

        if (loginStatus.status !== "pending") {
          setIsGoogleLoginLoading(false);
          console.log("[pollLoginStatus] 登录状态已确定:", loginStatus);
          return loginStatus;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (err) {
        console.error("[pollLoginStatus] 请求出错:", err);
        throw err;
      }
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoginLoading(true);
    const result = await googleLogin();
    const { session_id, redirect_url }: GoogleLoginResponse = result;
    if (redirect_url) {
      shell.open(redirect_url);
      const res = await pollLoginStatus(session_id);
      if (res.status === "completed") {
        setLoginInfo(res);
        appDataInit();
        navigate(Path.Chat);
        toast.success(
          type === "signin" ? t("signIn.success") : t("signUp.success"),
        );
        localStorage.setItem("user-email", res.email);
      }
    } else {
      setIsGoogleLoginLoading(false);
    }
  };

  return (
    <>
      <Divider label={t("signIn.or")} />
      <Button
        className="w-full h-11 !px-2.5 !py-2 border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoginLoading}
      >
        {isGoogleLoginLoading && (
          <LoadingIcon className="size-4 animate-spin" />
        )}
        <GoogleLoginIcon className="size-6" />
        {type === "signin" ? t("signIn.googleLogin") : t("signUp.googleLogin")}
      </Button>
    </>
  );
}
