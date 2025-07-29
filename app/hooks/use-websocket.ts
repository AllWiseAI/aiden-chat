import { useEffect } from "react";
import { websocketManager } from "../utils/websocket";
import { useAppConfig } from "../store/config";

export const useWebSocket = () => {
  const port = useAppConfig.getState().hostServerPort;

  useEffect(() => {
    websocketManager.connect(port);

    websocketManager.onMessage((msg) => {
      console.log("📩 WebSocket message:", msg);
    });

    return () => websocketManager.disconnect();
  }, [port]);
};
