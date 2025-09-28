import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useSettingStore } from "../store/setting";
import { useAppConfig } from "../store/config";
import { useAuthStore } from "../store/auth";
import { track } from "../utils/analysis";
import { getBaseDomain } from "../utils/fetch";

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
  const baseDomain = await getBaseDomain();

  wsWorker.postMessage({
    type: "connect",
    payload: {
      port: port,
      localToken: localToken,
      userToken: userToken,
      baseDomain: baseDomain,
    },
  });

  wsWorker.postMessage({
    type: "send",
    payload: { type: "ping" },
  });

  wsWorker.onmessage = (e) => {
    const { type, payload, message } = e.data;

    console.log("[Main][Websocket] onmessage type:", type);

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
  initWebsocketWorker();
  const getRegion = useSettingStore.getState().getRegion;
  getRegion();
};
