import { googleLogin, googleLoginStatus } from "../services";
import { useAuthStore } from "../store";
import { useTranslation } from "react-i18next";
import { appDataInit } from "../utils/init";
import { useNavigate } from "react-router-dom";
import { shell } from "@tauri-apps/api";
import { Path } from "../constant";
import { GoogleLoginResponse, GoogleStatusResponse } from "../typing";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { Button } from "@/app/components/shadcn/button";
import LoadingIcon from "@/app/icons/loading-spinner.svg";
import ReturnIcon from "@/app/icons/return.svg";
import { useEffect } from "react";

export function GoogleAuth() {
  const { t } = useTranslation("auth");
  const setLoginInfo = useAuthStore((state) => state.setLoginInfo);
  const navigate = useNavigate();

  async function pollLoginStatus(session_id: string): Promise<any> {
    const interval = 3000;

    while (true) {
      try {
        const loginStatus: GoogleStatusResponse = await googleLoginStatus({
          session_id,
        });
        console.log("[pollLoginStatus] 当前状态:", loginStatus.status);

        if (loginStatus.status !== "pending") {
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
    const result = await googleLogin();
    const { session_id, redirect_url }: GoogleLoginResponse = result;
    if (redirect_url) {
      shell.open(redirect_url);
      const res = await pollLoginStatus(session_id);
      if (res.status === "completed" || res.status === "completed_signup") {
        const status = res.status;
        setLoginInfo(res);
        appDataInit();
        if (status === "completed") {
          navigate(Path.Chat);
        } else if (status === "completed_signup") {
          navigate(Path.Invite);
        }
        localStorage.setItem("user-email", res.email);
      }
    }
  };

  useEffect(() => {
    handleGoogleLogin();
  }, []);

  return (
    <div className="w-full h-full px-6 py-25 bg-white dark:bg-[#141416] mx-auto flex flex-col justify-start items-center rounded-2xl">
      <div className="flex-center flex-col text-black dark:text-white">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5 text-[#00D47E]" />
          <LogoTextIcon className="h-5.5" />
        </div>
      </div>
      <div className="mt-20">
        <LoadingIcon className="text-primary size-6 animate-spin" />
      </div>
      <div className="mt-2.5 font-medium text-base">{t("authorizing")}</div>
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        className="mt-20 w-full h-11 !px-2.5 !py-2 border border-[#E8ECEF] text-black dark:text-white dark:bg-[#141416] dark:border-[#343839] hover:bg-[#F3F5F7] dark:hover:bg-[#232627]"
      >
        <ReturnIcon />
        {t("back")}
      </Button>
    </div>
  );
}
