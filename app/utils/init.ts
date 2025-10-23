import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useSettingStore } from "../store/setting";
import { useAppConfig } from "../store/config";
import { useAuthStore } from "../store/auth";
import { useAgentStore } from "../store";
import { track } from "../utils/analysis";

let websocketInitialized = false;

const initWebsocketWorker = async () => {
  console.log("[Main][Websocket] init websocket worker");
  if (websocketInitialized) {
    console.warn("[Main][Websocket] WebSocket already initialized, skipping.");
    return;
  }
  const wsWorker = new Worker(new URL("../ws.worker.ts", import.meta.url), {
    type: "module",
  });

  const port = useAppConfig.getState().hostServerPort;
  const localToken = useAppConfig.getState().localToken;
  const userToken = useAuthStore.getState().userToken;

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
