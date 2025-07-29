"use client";

import "../polyfill";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./home.module.scss";

import AidenIcon from "../icons/aiden-logo.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";
import i18n from "i18next";
import { getLang } from "../locales";
import { useWebSocket } from "../hooks/use-websocket";

import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { getClientConfig } from "../config/client";
import useAppSetting from "../hooks/use-app-setting";
import clsx from "clsx";
import { WindowHeader } from "./window-header";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <AidenIcon />}
      <LoadingIcon />
    </div>
  );
}

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const Task = dynamic(async () => (await import("./task")).Task, {
  loading: () => <Loading noLogo />,
});

const NewTask = dynamic(async () => (await import("./new-task")).NewTask, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const LoginPage = dynamic(async () => (await import("./login")).LoginPage, {
  loading: () => <Loading noLogo />,
});

const LoadingPage = dynamic(
  async () => (await import("./loading")).LoadingPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const SignUpPage = dynamic(async () => (await import("./signup")).SignUpPage, {
  loading: () => <Loading noLogo />,
});

const ForgotPasswordPage = dynamic(
  async () => (await import("./forgot-password")).ForgotPasswordPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const WindowSize = dynamic(() => import("./window-size"), {
  ssr: false,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      root.classList.remove("light", "dark");
      document.body.classList.remove("light");
      document.body.classList.remove("dark");

      if (config.theme === "dark") {
        root.classList.add("dark");
        document.body.classList.add("dark");
      } else if (config.theme === "light") {
        root.classList.add("light");
        document.body.classList.add("light");
      } else if (config.theme === "auto") {
        if (mediaQuery.matches) {
          root.classList.add("dark");
          document.body.classList.add("dark");
        } else {
          root.classList.add("light");
          document.body.classList.add("light");
        }
      }

      const metaDescriptionDark = document.querySelector(
        'meta[name="theme-color"][media*="dark"]',
      );
      const metaDescriptionLight = document.querySelector(
        'meta[name="theme-color"][media*="light"]',
      );

      if (config.theme === "auto") {
        metaDescriptionDark?.setAttribute("content", "#151515");
        metaDescriptionLight?.setAttribute("content", "#fafafa");
      } else {
        const themeColor = getCSSVar("--theme-color");
        metaDescriptionDark?.setAttribute("content", themeColor);
        metaDescriptionLight?.setAttribute("content", themeColor);
      }

      const themeColor = getCSSVar("--theme-color");
      const metaAll = document.querySelector(
        'meta[name="theme-color"]:not([media])',
      );
      metaAll?.setAttribute("content", themeColor);
    };

    applyTheme();

    if (config.theme === "auto") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getLang();
    document.documentElement.lang = lang;

    const handler = (lang: string) => {
      document.documentElement.lang = lang;
    };

    i18n.on("languageChanged", handler);

    // 清理副作用
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === Path.Home;

  useAppSetting();
  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  return (
    <div className={clsx(styles.container, styles["tight-container"])}>
      <SideBar
        className={clsx({
          [styles["sidebar-show"]]: isHome,
        })}
      />
      <WindowContent>
        <Routes>
          <Route element={<WindowHeader />}>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={`${Path.Task}/:id`} element={<Task />} />
          </Route>
          <Route path={Path.NewTask} element={<NewTask />} />
          <Route path={Path.Settings} element={<Settings />} />
        </Routes>
      </WindowContent>
    </div>
  );
}

export function AppRouter() {
  return (
    <Router>
      <WindowSize />
      <Routes>
        <Route path="/" element={<Navigate to={Path.Loading} replace />} />
        <Route path={Path.Loading} element={<LoadingPage />} />
        <Route path={Path.Login} element={<LoginPage />} />
        <Route path={Path.SignUp} element={<SignUpPage />} />
        <Route path={Path.ForgotPassword} element={<ForgotPasswordPage />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

export function Home() {
  useSwitchTheme();
  useHtmlLang();
  useWebSocket();
  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
  }, []);

  if (!useHasHydrated()) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}
