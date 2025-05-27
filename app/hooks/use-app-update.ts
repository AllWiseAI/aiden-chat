import { useEffect, useState, useCallback } from "react";
import {
  checkUpdate,
  installUpdate,
  onUpdaterEvent,
} from "@tauri-apps/api/updater";

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
  const [isShowUpdate, setIsShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function listenAndCheck() {
      try {
        unlisten = await onUpdaterEvent((payload: UpdaterEventPayload) => {
          const { status, error } = payload;

          console.log("[Updater]", status);

          if (error) {
            console.error("[Updater Error]:", error);
            setIsUpdating(false);
          }

          if (status === "UPDATE_AVAILABLE") {
            setIsShowUpdate(true);
          }

          if (status === "INSTALLING") {
            setIsUpdating(true);
          }
        });

        const update = await checkUpdate();
        if (update.shouldUpdate) {
          setIsShowUpdate(true);
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    }

    listenAndCheck();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await installUpdate();
    } catch (err) {
      console.error("Install update failed:", err);
      setIsUpdating(false);
    }
  }, []);

  return {
    isShowUpdate,
    isUpdating,
    handleUpdate,
  };
}
