import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useSettingStore } from "../store/setting";
import { useAppConfig } from "../store/config";
import { useAuthStore } from "../store/auth";
import { useAgentStore } from "../store";
import { track } from "../utils/analysis";

let websocketInitialized = false;
const REFRESH_INTERVAL = 5 * 60 * 1000;

const initWebsocketWorker = async () => {
  console.log("[Main][Websocket] init websocket worker");
  if (websocketInitialized) {
    // need refresh token here，since the token may be expired
    await doRefresh();
    console.warn("[Main][Websocket] WebSocket already initialized, skipping.");
    return;
  }
  const wsWorker = new Worker(new URL("../ws.worker.ts", import.meta.url), {
    type: "module",
  });

  const port = useAppConfig.getState().hostServerPort;
  const localToken = useAppConfig.getState().localToken;
  const userToken = useAuthStore.getState().userToken;
  const refreshToken = useAuthStore.getState().refreshToken;
  let shouldRefresh = true;
  async function doRefresh() {
    try {
      const result = await refreshToken();
      if (result) {
        wsWorker.postMessage({
          type: "refreshToken",
          payload: {
            accessToken: result,
          },
        });

        console.log("[Main][Websocket] Token refreshed successfully");
      } else {
        console.warn("[Main][Websocket] Invalid refresh result:", result);
        shouldRefresh = false;
      }
    } catch (err) {
      shouldRefresh = false;
      console.error("[Main][Websocket] Failed to refresh token:", err);
    }
  }

  doRefresh();

  const refreshTimer = setInterval(() => {
    if (!shouldRefresh) {
      clearInterval(refreshTimer);
      console.log("[Main][Websocket] Stopped token refresh loop.");
      return;
    }
    doRefresh();
  }, REFRESH_INTERVAL);

  wsWorker.postMessage({
    type: "connect",
    payload: {
      port: port,
      localToken: localToken,
      accessToken: userToken.accessToken,
    },
  });

  wsWorker.onmessage = (e) => {
    const { type, payload, message } = e.data;
    if (type === "status") {
      console.log("[Main][Websocket] status:", message);
      websocketInitialized = true;
    }

    if (type === "worker_log") {
      console.log("[Worker][Log]", payload);
    }

    if (type === "analytics_event") {
      console.log("[Main][Websocket] analytics_event:", payload);
      const { event_name, params } = payload;
      track(event_name, params);
    }
  };
};

export const appDataInit = async () => {
  await initLocalToken();
  useMcpStore.getState().init();
  useAppConfig.getState().initModelList();
  useAgentStore.getState().init();
  initWebsocketWorker();
  const getRegion = useSettingStore.getState().getRegion;
  getRegion();
  useAuthStore.getState().setUserPlan();
};
