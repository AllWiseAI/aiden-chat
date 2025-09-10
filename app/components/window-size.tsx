import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  appWindow,
  LogicalSize,
  LogicalPosition,
} from "@tauri-apps/api/window";
import { Path } from "../constant";
import { useSettingStore } from "../store";

export default function WindowSize() {
  const { windowBounds, setWindowBounds } = useSettingStore();

  function getIsInitPage(pathname: string): boolean {
    return (
      pathname === Path.Login ||
      pathname === Path.SignUp ||
      pathname === Path.Loading ||
      pathname === Path.ForgotPassword
    );
  }

  const location = useLocation();
  const isInitPage = getIsInitPage(location.pathname);

  const handleResolveSizeAndPosition = useCallback(async () => {
    const isInitPage = getIsInitPage(location.pathname);
    if (isInitPage) {
      return;
    }
    const physicalSize = await appWindow.innerSize();
    const scaleFactor = await appWindow.scaleFactor();
    const logicalWidth = physicalSize.width / scaleFactor;
    const logicalHeight = physicalSize.height / scaleFactor;
    const position = await appWindow.outerPosition();
    const logicalX = position.x / scaleFactor;
    const logicalY = position.y / scaleFactor;
    if (logicalWidth <= 426 && logicalHeight <= 750) {
      console.log("[skip] window too small, not saving");
      return;
    }
    setWindowBounds({
      width: logicalWidth,
      height: logicalHeight,
      x: logicalX,
      y: logicalY,
    });
  }, [location, setWindowBounds]);

  useEffect(() => {
    async function adjustWindow() {
      if (isInitPage) {
        await appWindow.setSize(new LogicalSize(426, 750));
        await appWindow.setResizable(false);
        await appWindow.center();
        return;
      }
      await appWindow.setResizable(true);
      const { x, y, width, height } = windowBounds;
      if (width) {
        await appWindow.setSize(new LogicalSize(width, height));
        await appWindow.setPosition(new LogicalPosition(x, y));
      } else {
        await appWindow.setSize(new LogicalSize(1200, 750));
        await appWindow.center();
      }

      const unlistenSize = await appWindow.onResized(
        handleResolveSizeAndPosition,
      );
      const unlistenMove = await appWindow.onMoved(
        handleResolveSizeAndPosition,
      );
      return () => {
        unlistenSize();
        unlistenMove();
      };
    }
    adjustWindow();
  }, [isInitPage, handleResolveSizeAndPosition]); // not add windowBounds to deps, it will cause infinite loop

  return null;
}
