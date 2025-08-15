import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useAppConfig } from "../store/config";
import { showNotification } from "../utils/notification";
import { websocketManager } from "../utils/websocket";
import { getHeaders } from "../utils/fetch";

const titleMap = {
  task_completed: "Task Completed",
  task_failed: "Task Failed",
  task_tested: "Task Tested",
  get_latest_refresh_token: "Get Latest Refresh Token",
};

const initWebsocket = () => {
  const port = useAppConfig.getState().hostServerPort;
  const localToken = useAppConfig.getState().localToken;
  websocketManager.connect(port, localToken);
  websocketManager.onMessage(async (msg) => {
    if (msg.type === "get_latest_refresh_token") {
      const headers = await getHeaders({ aiden: true });
      websocketManager.send({
        type: "update_refresh_token",
        token: headers["Aiden-Authorization"],
      });
    }
    if (["task_completed", "task_failed", "task_tested"].includes(msg.type))
      showNotification({
        title: titleMap[msg.type] ?? msg.type,
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
