import { useEffect, useCallback } from "react";
import {
  checkUpdate,
  installUpdate,
  onUpdaterEvent,
} from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
import { useUpdateStore } from "@/app/store/app-update";

type UpdateStatus =
  | "PENDING"
  | "ERROR"
  | "DONE"
  | "UPTODATE"
  | "UPDATE_AVAILABLE"
  | "INSTALLING";

interface UpdaterEventPayload {
  status: UpdateStatus;
  error?: string;
}

export function useAppUpdate() {
  const {
    isShowUpdate,
    isUpdating,
    isLatest,
    error,
    setShowUpdate,
    setUpdating,
    setLatest,
    setStatus,
    setError,
  } = useUpdateStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function listenAndCheck() {
      try {
        unlisten = await onUpdaterEvent((payload: UpdaterEventPayload) => {
          const { status, error } = payload;
          console.log("[Updater]", status);
          setStatus(status);

          if (error) {
            console.error("[Updater Error]:", error);
            setError(error);
            setUpdating(false);
          }

          switch (status) {
            case "UPDATE_AVAILABLE":
              setShowUpdate(true);
              break;
            case "INSTALLING":
              setUpdating(true);
              break;
            case "UPTODATE":
              setLatest(true);
              break;
            case "DONE":
              setUpdating(false);
              relaunch();
              break;
          }
        });

        const update = await checkUpdate();
        if (update.shouldUpdate) {
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

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      await installUpdate();
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
