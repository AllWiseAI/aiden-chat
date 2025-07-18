import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { HOST_SERVER_READY_EVENT } from "../constant";
import { useAppConfig } from "../store/config";

const LOADING_TIMEOUT = Number(
  process.env.NEXT_PUBLIC_LOADING_TIMEOUT || 40000,
);

let resolved = false;

export function useHostServerReady(onReady: (ready: boolean) => void) {
  const config = useAppConfig.getState();
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("Host server not ready, timeout");
        onReady(false);
      }
    }, LOADING_TIMEOUT);

    const unlistenPromise = listen(HOST_SERVER_READY_EVENT, (event) => {
      const port = event.payload as number | undefined;
      console.log("Host server ready, port ", port);

      if (!port) {
        console.log("Host server ready, but port is undefined");
        clearTimeout(timeout);
        onReady(false);
        return;
      }
      config.setHostPort(port);
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
  }, [onReady, config]);
}
