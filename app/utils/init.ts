import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useAppConfig } from "../store/config";
import { showNotification } from "../utils/notification";
import { websocketManager } from "../utils/websocket";

const initWebsocket = () => {
  const port = useAppConfig.getState().hostServerPort;
  const localToken = useAppConfig.getState().localToken;
  websocketManager.connect(port, localToken);
  websocketManager.onMessage((msg) => {
    console.log("WebSocket message:", msg);
    showNotification({
      title: msg.type,
      body: msg.task_description,
    });
  });
};

export const appDataInit = async () => {
  await initLocalToken();
  useMcpStore.getState().init();
  useAppConfig.getState().initModelList();
  initWebsocket();
};
