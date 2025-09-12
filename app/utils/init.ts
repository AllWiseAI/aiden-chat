import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useSettingStore } from "../store/setting";
import { useAppConfig } from "../store/config";
import { showNotification } from "../utils/notification";
import {
  TaskFailed,
  websocketManager,
  TaskCompletedOrTested,
} from "../utils/websocket";
import { getHeaders } from "../utils/fetch";
import { track, EventName } from "../utils/analysis";

const titleMap = {
  task_completed: "Task Completed",
  task_failed: "Task Failed",
  task_tested: "Task Tested",
  get_latest_refresh_token: "Get Latest Refresh Token",
  analytics_event: "Analytics Event",
};

const initWebsocket = () => {
  const port = useAppConfig.getState().hostServerPort;
  const localToken = useAppConfig.getState().localToken;
  websocketManager.connect(port, localToken);
  websocketManager.onMessage(async (msg) => {
    if (msg.type === "get_latest_refresh_token") {
      console.log("[websocket] get_latest_refresh_token", msg);
      const headers = await getHeaders({ aiden: true });
      websocketManager.send({
        type: "update_refresh_token",
        token: headers["Aiden-Authorization"],
      });
    }
    if (msg.type === "analytics_event") {
      console.log("[websocket] analytics_event", msg);
      const { event_name, params } = msg;
      track(event_name as EventName, params);
    }
    if (["task_completed", "task_failed", "task_tested"].includes(msg.type)) {
      console.log("[websocket] task result: ", msg.type);
      showNotification({
        title: titleMap[msg.type] ?? msg.type,
        body: (msg as TaskCompletedOrTested | TaskFailed).task_description,
      });
    }
  });
};

export const appDataInit = async () => {
  await initLocalToken();
  useMcpStore.getState().init();
  useAppConfig.getState().initModelList();
  initWebsocket();
  const getRegion = useSettingStore.getState().getRegion;
  getRegion();
};
