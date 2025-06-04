import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  McpItemInfo,
  TRemoteMcpInfo,
  CustomMCPServer,
  MCPConfig,
  MCPServer,
  McpStatusItem,
  McpAction,
  TSettingInfo,
  TTemplateInfo,
} from "@/app/typing";
import {
  getFirstValue,
  fetchMcpStatus,
  getMcpStatusList,
  readMcpConfig,
  getRemoteMcpList,
  getRenderMcpList,
  updateConfig,
  restoreServers,
  parseConfig,
  parseTemplate,
  replaceTemplate,
} from "@/app/utils/mcp";
import { delay } from "@/app/utils";

let pollingTimer: NodeJS.Timeout | null = null;

const DEFAULT_MCP_STATE = {
  config: null as MCPConfig | null,
  remoteMcpList: [] as TRemoteMcpInfo[],
  renderMcpList: [] as McpItemInfo[],
  mcpRemoteInfoMap: new Map(),
  mcpStatusList: [] as McpStatusItem[],
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
        console.log("[Mcp store] updateMcpStatusList", type, name, action);
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

      updateTemplate: async (name: string, templateInfo: TTemplateInfo) => {
        console.log("[Mcp store] updateTemplate", name, templateInfo);
        const { config, renderMcpList } = _get();
        if (!config) return;
        const newConfig = {
          ...config,
          mcpServers: {
            ...config.mcpServers,
            [name]: {
              ...config.mcpServers[name],
              args: replaceTemplate(
                config.mcpServers[name].args,
                templateInfo.templates,
                templateInfo.multiArgs,
              ),
              env: Object.fromEntries(
                templateInfo.envs.map((item) => [item.key, item.value]),
              ),
            },
          },
        };
        set({ config: newConfig });

        const newList = renderMcpList.map((item) => {
          if (item.mcp_name === name) {
            return {
              ...item,
              settingInfo: parseConfig(newConfig.mcpServers[name]),
              templateInfo,
            };
          }
          return item;
        });

        set({ renderMcpList: newList });
        await updateConfig(newConfig);
      },

      updateMcpArgsEnvs: async (name: string, settingInfo: TSettingInfo) => {
        console.log("[Mcp store] updateMcpArgsEnvs", name, settingInfo);
        const { config, renderMcpList, updateMcpStatusList } = _get();
        if (!config) return;
        const newConfig = {
          ...config,
          mcpServers: {
            ...config.mcpServers,
            [name]: {
              ...config.mcpServers[name],
              args: [...settingInfo.args],
              env: Object.fromEntries(
                settingInfo.envs.map((item) => [item.key, item.value]),
              ),
            },
          },
        };
        set({ config: newConfig });

        const newList = renderMcpList.map((item) => {
          if (item.mcp_name === name) {
            return {
              ...item,
              settingInfo,
            };
          }
          return item;
        });

        set({ renderMcpList: newList });
        await updateConfig(newConfig);
        if (config.mcpServers[name].aiden_enable) {
          updateMcpStatusList({ name, action: McpAction.Loading }, "update");
          await delay(500);
          try {
            const newAction = await fetchMcpStatus(name);
            updateMcpStatusList({ name: name, action: newAction }, "update");
          } catch (err) {
            console.error(err);
          }
        }
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
        console.log("[Mcp store] switchMcpStatus: ", name, enable);
        const { config, mcpRemoteInfoMap, renderMcpList } = get();
        if (!config) return;
        let newConfig;
        let settingInfo = null;
        let templateInfo = null;
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
          settingInfo = parseConfig(config.mcpServers[name]);
          templateInfo = parseTemplate(config.mcpServers[name]);
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
          settingInfo = parseConfig(newConfig.mcpServers[name]);
          templateInfo = parseConfig(newConfig.mcpServers[name]);
        }

        set({ config: newConfig });
        const newList = renderMcpList.map((item) => {
          if (item.mcp_id === id) {
            return {
              ...item,
              checked: enable,
              settingInfo: settingInfo,
              templateInfo: templateInfo,
            };
          }
          return item;
        });
        set({ renderMcpList: newList as McpItemInfo[] });

        await updateConfig(newConfig);
      },

      removeMcpItem: async (name: string) => {
        console.log("[Mcp store] removeMcpItem: ", name);
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
