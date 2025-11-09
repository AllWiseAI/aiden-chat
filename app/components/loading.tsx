import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useHostServerReady } from "../hooks/use-server-ready";
import { useEffect } from "react";
import { Path } from "../constant";
import { Button } from "./shadcn/button";
import { relaunch } from "@tauri-apps/plugin-process";
import ReturnIcon from "../icons/return.svg";
import LogoIcon from "@/app/icons/logo.svg";
import LogoTextIcon from "../icons/logo-text.svg";
import LoadingIcon from "../icons/three-dots.svg";
import ResultLightIcon from "../icons/result-light.svg";
import ResultDarkIcon from "../icons/result-dark.svg";
import { Theme } from "../store";
import { useTheme } from "../hooks/use-theme";
import { useAuthStore } from "../store";
import { exportAndDownloadLog } from "../utils/log";
import { appDataInit } from "../utils/init";

export function LoadingPage() {
  const navigate = useNavigate();
  const hydrated = useAuthStore((state) => state._hasHydrated);
  const isLogin = useAuthStore((state) => state.isLogin);
  const init = useAuthStore((state) => state.initialize);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const [isServerTimeout, setIsServerTimeout] = useState(false);
  const theme = useTheme();

  const handleReload = () => {
    relaunch();
  };

  useHostServerReady(async (ready) => {
    if (ready || process.env.NODE_ENV === "development") {
      setIsServerReady(true);
      if (!isAuthed) return;
      appDataInit();
      navigate(Path.Chat, { replace: true });
    } else {
      setIsServerReady(false);
      setIsServerTimeout(true);
    }
  });

  // if not login, redirect to login page
  useEffect(() => {
    if (!hydrated) return;
    if (!isServerReady) return;
    (async () => {
      const ok = await init();
      setIsAuthed(true);
      if (!ok || !isLogin) {
        navigate(Path.Login, { replace: true });
      } else if (isServerReady) {
        appDataInit();
        navigate(Path.Chat, { replace: true });
      }
    })();
  }, [hydrated, isLogin, isServerReady, init, navigate]);

  return (
    <div className="relative bg-white dark:bg-[#141416] flex flex-col items-center justify-center w-full h-full">
      <div className="absolute top-15">
        <div className="flex items-end gap-2">
          <LogoIcon className="size-7.5 text-[#00D47E]" />
          <LogoTextIcon className="h-5.5" />
        </div>
      </div>
      {isServerTimeout ? (
        <div className="relative">
          <div className="text-base font-medium flex flex-col items-center">
            <div className="mb-5">
              {theme === Theme.Light ? <ResultLightIcon /> : <ResultDarkIcon />}
            </div>
            <div
              className="text-[#6C7275] text-sm text-center border dark:border-[#232627] rounded-2xl p-4 bg-[#F3F5F7] dark:bg-[#141718]/30"
              style={{ marginBottom: "102px" }}
            >
              App is not ready, please reload later.
            </div>
            <Button
              className="w-30 h-12 rounded-full p-0 bg-[#00D47E]/12 hover:bg-[#00D47E]/20 text-main"
              onClick={() => handleReload()}
            >
              <ReturnIcon />
              Restart
            </Button>
            <Button
              className="w-30 h-12 p-0 !text-sm"
              onClick={exportAndDownloadLog}
              variant="link"
            >
              Export Log
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center">
          <LoadingIcon />
          <div className="mt-5 text-base font-medium">Loading</div>
        </div>
      )}
    </div>
  );
}
