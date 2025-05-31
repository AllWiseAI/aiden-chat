import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  updateMcpConfig as updateRemoteMcpConfig,
  getRemoteMcpItems,
  searchMcpServerStatus,
} from "@/app/services";
import { invoke } from "@tauri-apps/api/tauri";

import {
  McpItemInfo,
  TRemoteMcpInfo,
  CustomMCPServer,
  MCPConfig,
  MCPServer,
  McpStatusItem,
  McpAction,
} from "@/app/typing";

let pollingTimer: NodeJS.Timeout | null = null;

const DEFAULT_MCP_STATE = {
  config: null as MCPConfig | null,
  remoteMcpList: [] as TRemoteMcpInfo[],
  renderMcpList: [] as McpItemInfo[],
  mcpRemoteInfoMap: new Map(),
  mcpStatusList: [] as McpStatusItem[],
};

const isEmptyObject = (obj: any) => {
  return Object.keys(obj).length === 0;
};

const getFirstValue = <T extends Record<string, any>>(
  obj: T,
): T[keyof T] | undefined => {
  const firstKey = Object.keys(obj)[0];
  return firstKey ? obj[firstKey] : undefined;
};

const fetchMcpStatus = async (name: string): Promise<McpAction> => {
  try {
    const res = (await searchMcpServerStatus(name)) as any;
    if (!res || !res.data) {
      throw new Error("No data");
    }
    const { data } = res;
    if (data.status) return data.status;
    else throw new Error("No status");
  } catch (e) {
    return McpAction.Failed;
  }
};

const getMcpStatusList = async (config: MCPConfig) => {
  if (!config) return;
  const enableList = Object.keys(config.mcpServers || {}).filter((name) => {
    const item = config.mcpServers[name];
    return item.aiden_enable;
  });
  console.log("enableList===", enableList);
  const mcpStatusList = await Promise.all(
    enableList.map(async (name) => {
      const status = await fetchMcpStatus(name);
      return { name, action: status };
    }),
  );
  console.log("mcpStatusList===", mcpStatusList);
  return mcpStatusList;
};

const readMcpConfig = async () => {
  console.log("[Mcp store] readMcpConfig");
  const data = await invoke<MCPConfig>("read_mcp_config");
  return data;
};

const getRemoteMcpList = async () => {
  console.log("[Mcp store] getRemoteMcpList");
  const remoteMcpItems = (await getRemoteMcpItems()) as TRemoteMcpInfo[];
  return remoteMcpItems || [];
};

const getRenderMcpList: any = async (
  config: any,
  remoteMcpList: TRemoteMcpInfo[],
) => {
  console.log("[Mcp store] getRenderMcpList");
  if (!config)
    return {
      mcpRemoteInfoMap: new Map(),
      renderMcpList: [],
    };
  const items: McpItemInfo[] = [];
  const addedInJSONIds: string[] = [];
  const mcpRemoteInfoMap = new Map();
  for (let item of remoteMcpList) {
    mcpRemoteInfoMap.set(item.mcp_id, item);
  }
  if (config?.mcpServers) {
    Object.entries(config.mcpServers).forEach(([name, server]) => {
      const { aiden_type, aiden_enable, aiden_id } = server as CustomMCPServer;
      if (!mcpRemoteInfoMap.has(aiden_id)) {
        items.push({
          mcp_id: aiden_id,
          mcp_name: name,
          checked: aiden_enable,
          description: "",
          description_en: "",
          description_zh: "",
          tutorial: "",
          tutorial_en: "",
          tutorial_zh: "",
          mcp_logo: "",
          type: aiden_type,
        });
      } else {
        addedInJSONIds.push(aiden_id);
        items.push({
          ...mcpRemoteInfoMap.get(aiden_id),
          mcp_id: aiden_id,
          mcp_name: name,
          checked: aiden_enable,
          type: "remote",
          showDelete: false,
        });
      }
    });
  }

  for (let item of remoteMcpList) {
    if (
      !addedInJSONIds.includes(item.mcp_id) &&
      item.mcp_id &&
      !isEmptyObject(item.basic_config)
    ) {
      items.push({
        ...item,
        type: "remote",
        checked: false,
      });
    }
  }

  return {
    mcpRemoteInfoMap,
    renderMcpList: items,
  };
};

const updateLocalConfig = async (config: any) => {
  console.log("[Mcp store] updateLocalConfig");
  try {
    await invoke<MCPConfig>("write_mcp_config", { newConfig: config });
    return true;
  } catch (e: any) {
    throw new Error(e);
  }
};

const updateConfig = async (newConfig: any) => {
  try {
    let res = await updateLocalConfig(newConfig);
    if (res) {
      console.log("[Mcp store] updateRemoteMcpConfig");
      updateRemoteMcpConfig(newConfig);
    } else {
      console.log("Failed to write local mcp.config.json", res);
    }
  } catch (e: any) {
    console.log("Failed to write local mcp.config.json", e);
  }
};

const restoreServers = (
  newConfig: Record<string, MCPServer>,
  config: MCPConfig,
) => {
  console.log("[Mcp store] restoreServers");
  const updatedConfig: Record<string, CustomMCPServer> = {};
  Object.entries(newConfig).forEach(([name, server]) => {
    updatedConfig[name] = {
      ...server,
      aiden_enable: config?.mcpServers[name]?.aiden_enable || true,
      aiden_id: config?.mcpServers[name]?.aiden_id || "",
      aiden_type: config?.mcpServers[name]?.aiden_type || "custom",
    };
  });
  return updatedConfig;
};

export const useMcpStore = createPersistStore(
  {
    _hasHydrated: false,
    ...DEFAULT_MCP_STATE,
  },
  (set, get) => {
    function _get() {
      return {
        ...get(),
        ...methods,
      };
    }
    const methods = {
      setHydrated: () => {
        set({ _hasHydrated: true });
      },
      init: async () => {
        console.log("[Mcp store] init start");
        const { startPollingMcpStatus } = _get();
        const config = await readMcpConfig();
        const remoteMcpList = await getRemoteMcpList();
        const { renderMcpList, mcpRemoteInfoMap } = await getRenderMcpList(
          config,
          remoteMcpList,
        );

        const mcpStatusList = await getMcpStatusList(config);
        startPollingMcpStatus();

        set({
          config,
          remoteMcpList,
          renderMcpList,
          mcpRemoteInfoMap,
          mcpStatusList,
        });
        console.log("[Mcp store] init end");
      },

      updateMcpStatusList: async (
        { name, action }: McpStatusItem,
        type: "update" | "delete",
      ) => {
        console.log("[Mcp store] updateMcpStatusList", name, action);
        const { mcpStatusList } = get();
        if (type === "delete") {
          const newMcpStatusList = [...mcpStatusList].filter(
            (item) => item.name !== name,
          );
          set({ mcpStatusList: newMcpStatusList });
          return;
        }

        const newMcpStatusList = [...mcpStatusList];
        let hasItem = mcpStatusList.some((item) => item.name === name);
        if (!hasItem) {
          newMcpStatusList.push({ name, action });
        } else {
          newMcpStatusList.forEach((item) => {
            if (item.name === name) {
              item.action = action;
            }
          });
        }
        set({ mcpStatusList: newMcpStatusList });
      },

      getCleanedConfig: () => {
        console.log("[Mcp store] getCleanedConfig");
        const { config } = get();
        if (!config) return {};
        const cleaned: Record<string, MCPServer> = {};
        Object.entries(config.mcpServers).forEach(([name, server]) => {
          const { aiden_id, aiden_type, aiden_enable, ...other } =
            server as CustomMCPServer;
          if (aiden_enable) {
            cleaned[name] = other;
          }
        });
        return cleaned;
      },

      saveEditorConfig: async (newServers: Record<string, MCPServer>) => {
        console.log("[Mcp store] saveEditorConfig");
        const { config, remoteMcpList } = get();
        if (!config) return false;
        const updatedMcpServers = restoreServers(newServers, config);

        const newConfig = { ...config, mcpServers: { ...updatedMcpServers } };
        set({ config: newConfig });
        await updateConfig(newConfig);
        const mcpStatusList = await getMcpStatusList(newConfig);
        set({ mcpStatusList });
        const { renderMcpList, mcpRemoteInfoMap } = await getRenderMcpList(
          newConfig,
          remoteMcpList,
        );
        set({ renderMcpList, mcpRemoteInfoMap });
        return true;
      },

      switchMcpStatus: async ({
        id,
        name,
        enable,
        type,
      }: {
        id: string;
        name: string;
        type: string;
        enable: boolean;
      }) => {
        console.log("[Mcp store] switchMcpStatus");
        const { config, mcpRemoteInfoMap, renderMcpList } = get();
        if (!config) return;
        let newConfig;
        if (config.mcpServers[name]) {
          // enable or disable a local item
          newConfig = {
            ...config,
            mcpServers: {
              ...config.mcpServers,
              [name]: {
                ...config.mcpServers[name],
                aiden_enable: enable,
              },
            },
          };
        } else {
          // enable -> add item "remote"
          newConfig = {
            ...config,
            mcpServers: {
              ...config.mcpServers,
              [name]: {
                ...(getFirstValue(mcpRemoteInfoMap.get(id)?.basic_config) ||
                  {}),
                aiden_enable: enable,
                aiden_type: type,
                aiden_id: id,
              },
            },
          };
        }

        set({ config: newConfig });
        await updateConfig(newConfig);

        const newList = renderMcpList.map((item) => {
          if (item.mcp_id === id) {
            return {
              ...item,
              checked: enable,
            };
          }
          return item;
        });
        set({ renderMcpList: newList });
      },

      removeMcpItem: async (name: string) => {
        console.log("[Mcp store] removeMcpItem");
        const { config, renderMcpList, updateMcpStatusList } = _get();
        if (!config) return;
        let beforeMcpServers = { ...config.mcpServers };
        delete beforeMcpServers[name];
        const newConfig = {
          ...config,
          mcpServers: { ...beforeMcpServers },
        };
        set({ config: newConfig });
        await updateConfig(newConfig);
        const newList = renderMcpList.filter((item) => item.mcp_name !== name);
        set({ renderMcpList: newList });
        updateMcpStatusList({ name, action: McpAction.Loading }, "delete");
      },

      pollMcpStatus: async () => {
        console.log("[Mcp store] pollMcpStatus");
        const { mcpStatusList, updateMcpStatusList, config } = _get();
        if (!config) return;

        const loadingItems = mcpStatusList.filter(
          (item) => item.action === McpAction.Loading,
        );

        if (loadingItems.length > 0) {
          for (const item of loadingItems) {
            try {
              const newAction = await fetchMcpStatus(item.name);
              updateMcpStatusList(
                { name: item.name, action: newAction },
                "update",
              );
            } catch (err) {
              console.warn(`[Mcp store] 轮询 ${item.name} 状态失败`, err);
            }
          }
        }
        pollingTimer = setTimeout(_get().pollMcpStatus, 5000); // 5000ms 后再次执行轮询
      },

      startPollingMcpStatus: () => {
        const { pollMcpStatus } = _get();
        if (!pollingTimer) {
          pollingTimer = setTimeout(pollMcpStatus, 5000); // 5000ms 后首次执行轮询
          console.log("[Mcp store] 启动全局轮询");
        }
      },

      stopPollingMcpStatus: () => {
        if (pollingTimer) {
          clearTimeout(pollingTimer);
          pollingTimer = null;
        }
      },
    };

    return methods;
  },
  {
    name: StoreKey.Mcp,
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
