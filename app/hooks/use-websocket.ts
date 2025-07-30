import { useEffect } from "react";
import { websocketManager } from "../utils/websocket";
import { useAppConfig } from "../store/config";
import { showNotification } from "../utils/notification";

export const useWebSocket = () => {
  const port = useAppConfig.getState().hostServerPort;

  useEffect(() => {
    websocketManager.connect(port);

    websocketManager.onMessage((msg) => {
      console.log("WebSocket message:", msg);

      showNotification({
        title: msg.type,
        body: msg.task_description,
      });
    });

    return () => websocketManager.disconnect();
  }, [port]);
};
