import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { HOST_SERVER_READY_EVENT } from "../constant";
import { useAppConfig } from "../store/config";
import { getLocalToken } from "../services";

const LOADING_TIMEOUT = Number(
  process.env.NEXT_PUBLIC_LOADING_TIMEOUT || 40000,
);

let resolved = false;

export function useHostServerReady(onReady: (ready: boolean) => void) {
  const config = useAppConfig.getState();
  async function getToken() {
    try {
      const token = await getLocalToken();
      const { data } = token;
      config.setLocalToken(data);
    } catch (error) {
      console.log("getLocalToken error", error);
    }
  }
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
      getToken();
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
