import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_SETTING_STATE = {
  device_id: "",
};

export const useSettingStore = createPersistStore(
  {
    _hasHydrated: false,
    user_mcp_always_approve_status: <Record<string, boolean>>{},
    ...DEFAULT_SETTING_STATE,
  },
  (set, get) => ({
    setHydrated: () => {
      set({ _hasHydrated: true });
    },
    getDeviceId: () => {
      if (!get()._hasHydrated) return false;
      const { device_id } = get();
      if (!device_id) {
        const device_id = uuidv4();
        set({ device_id: device_id });
        console.log("device_id:", device_id);
        return device_id;
      }
      console.log("device_id:", device_id);
      return device_id;
    },
    getUserMcpApproveStatus: (name: string) => {
      if (!get()._hasHydrated) return false;
      const { user_mcp_always_approve_status } = get();
      return user_mcp_always_approve_status[name];
    },
    setUserMcpApproveStatus: (name: string, status: boolean) => {
      const { user_mcp_always_approve_status } = get();
      set({
        user_mcp_always_approve_status: {
          ...user_mcp_always_approve_status,
          [name]: status,
        },
      });
    },
  }),
  {
    name: StoreKey.Setting,
    version: 1,
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) {
          console.log("an error happened during hydration", error);
        } else {
          state?.setHydrated();
        }
      };
    },
  },
);
