import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";
import { Path } from "../constant";

export default function WindowSize() {
  const location = useLocation();
  const isInitPage =
    location.pathname === Path.Login ||
    location.pathname === Path.SignUp ||
    location.pathname === Path.Loading ||
    location.pathname === Path.ForgotPassword;

  useEffect(() => {
    async function adjustWindow() {
      if (isInitPage) {
        await appWindow.setSize(new LogicalSize(500, 670));
        await appWindow.setResizable(false);
      } else {
        await appWindow.setSize(new LogicalSize(1080, 670));
        await appWindow.setResizable(true);
      }
      await appWindow.center();
    }
    adjustWindow();
  }, [isInitPage]);

  return null;
}
