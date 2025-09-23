import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import { v4 as uuidv4 } from "uuid";
import { apiGetRegion } from "../services/auth";

type WindowBounds = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const DEFAULT_SETTING_STATE = {
  device_id: "",
  region: "",
};

export const useSettingStore = createPersistStore(
  {
    _hasHydrated: false,
    user_mcp_always_approve_status: <Record<string, boolean>>{},
    windowBounds: {} as WindowBounds,
    ...DEFAULT_SETTING_STATE,
  },
  (set, get) => ({
    setHydrated: () => {
      set({ _hasHydrated: true });
    },
    setWindowBounds: (bounds: WindowBounds) => {
      set({ windowBounds: bounds });
    },
    getDeviceId: () => {
      if (!get()._hasHydrated) return;
      const { device_id } = get();
      if (!device_id) {
        const device_id = uuidv4();
        set({ device_id: device_id });
        return device_id;
      }
      return device_id;
    },
    getRegion: async () => {
      if (!get()._hasHydrated) return;
      if (get().region) return get().region;
      try {
        const res = (await apiGetRegion()) as any;
        if ("country_code" in res && !res.country_code) {
          const code = res.country_code;
          set({ region: code });
        } else {
          const locale = Intl.DateTimeFormat().resolvedOptions().locale;
          const region = locale.split("-")[1]?.toUpperCase();
          set({ region });
        }
      } catch (e) {
        console.error("getRegion error:", e);
        set({ region: "CN" });
      }
    },
    setRegion: (region: string) => {
      set({ region });
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
    version: 2,
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
