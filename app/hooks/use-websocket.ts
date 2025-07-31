import { useEffect } from "react";
import { websocketManager } from "../utils/websocket";
import { useAppConfig } from "../store/config";
import { showNotification } from "../utils/notification";
import { toast } from "sonner";

export const useWebSocket = () => {
  const port = useAppConfig.getState().hostServerPort;

  useEffect(() => {
    websocketManager.connect(port);

    websocketManager.onMessage((msg) => {
      console.log("WebSocket message:", msg);

      if (msg.type === "task_failed") {
        // @ts-ignore
        toast.error(`任务"${msg.task_name}"失败`);
        // @ts-ignore
      } else if (msg.type === "task_success") {
        // @ts-ignore
        toast.success(`任务"${msg.task_name}"成功`);
      }
      showNotification({
        title: msg.type,
        body: msg.task_description,
      });
    });

    return () => websocketManager.disconnect();
  }, [port]);
};
