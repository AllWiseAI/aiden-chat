import { googleLogin, googleLoginStatus } from "../services";
import { useAuthStore } from "../store";
import { useTranslation } from "react-i18next";
import { appDataInit } from "../utils/init";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-shell";
import { Path } from "../constant";
import { GoogleLoginResponse, GoogleStatusResponse } from "../typing";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "@/app/icons/logo-text.svg";
import { Button } from "@/app/components/shadcn/button";
import LoadingIcon from "@/app/icons/loading-spinner.svg";
import ReturnIcon from "@/app/icons/return.svg";
import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function GoogleAuth() {
  const { t } = useTranslation("auth");
  const setLoginInfo = useAuthStore((state) => state.setLoginInfo);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function pollLoginStatus(session_id: string): Promise<any> {
      const interval = 3000;
      while (!controller.signal.aborted) {
        try {
          const res: GoogleStatusResponse = await googleLoginStatus({
            session_id,
          });
          console.log("[pollLoginStatus] 当前状态:", res.status);

          if (res.status !== "pending") {
            console.log("[pollLoginStatus] 登录状态已确定:", res);
            return res;
          }
        } catch (err) {
          if (controller.signal.aborted) return;
          console.error("[pollLoginStatus] 请求出错:", err);
        }
        await new Promise((r) => setTimeout(r, interval));
      }
    }

    async function handleGoogleLogin() {
      try {
        const { session_id, redirect_url }: GoogleLoginResponse =
          await googleLogin();
        if (!redirect_url) return;
        open(redirect_url);

        const result = await pollLoginStatus(session_id);
        if (!result || controller.signal.aborted) return;

        const status = result.status;
        if (status === "completed" || status === "completed_signup") {
          setLoginInfo(result);
          appDataInit();
          const appWindow = getCurrentWindow();
          await appWindow.show();
          await appWindow.setFocus();
          localStorage.setItem("user-email", result.email);

          navigate(status === "completed" ? Path.Chat : Path.Invite);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("[GoogleAuth] 登录流程出错:", err);
        }
      }
    }

    handleGoogleLogin();

    return () => {
      console.log("[GoogleAuth] 组件卸载，终止轮询");
      controller.abort();
    };
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
