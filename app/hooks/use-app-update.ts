import { useEffect, useCallback } from "react";
import { check, downloadAndInstall } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useUpdateStore } from "@/app/store/app-update";

export function useAppUpdate() {
  const {
    isShowUpdate,
    isUpdating,
    isLatest,
    error,
    setShowUpdate,
    setUpdating,
    setLatest,
    setError,
  } = useUpdateStore();

  useEffect(() => {
    async function listenAndCheck() {
      try {
        // 检查更新
        const update = await check();
        if (update) {
          setShowUpdate(true);
        } else {
          setLatest(true);
        }
      } catch (err) {
        console.error("Update check failed:", err);
        setUpdating(false);
        setError((err as Error).message);
      }
    }

    listenAndCheck();
  }, []);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      await downloadAndInstall();
      setUpdating(false);
      relaunch();
    } catch (err) {
      console.error("Install update failed:", err);
      setUpdating(false);
      setError((err as Error).message);
    }
  }, [setUpdating, setError]);

  return {
    isShowUpdate,
    isUpdating,
    isLatest,
    error,
    handleUpdate,
  };
}
