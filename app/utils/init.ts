import { initLocalToken } from "../utils/fetch";
import { useMcpStore } from "../store/mcp";
import { useAppConfig } from "../store/config";

export const appDataInit = async () => {
  await initLocalToken();
  useMcpStore.getState().init();
  useAppConfig.getState().initModelList();
};
