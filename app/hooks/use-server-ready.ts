import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { HOST_SERVER_READY_EVENT } from "../constant";

const LOADING_TIMEOUT = 1000;
let resolved = false;
export function useHostServerReady(onReady: (ready: boolean) => void) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("Host server not ready, timeout");
        onReady(false);
      }
    }, LOADING_TIMEOUT);

    const unlistenPromise = listen(HOST_SERVER_READY_EVENT, () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.log("Host server start ready");
        onReady(true);
      }
    });

    return () => {
      clearTimeout(timeout);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onReady]);
}
