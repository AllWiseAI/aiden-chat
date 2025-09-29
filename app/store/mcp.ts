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
  batchFetchMcpStatus,
  getMcpStatusList,
  readMcpConfig,
  getRemoteMcpList,
  getRenderMcpList,
  updateConfig,
  restoreServers,
  parseConfig,
  parseTemplate,
  replaceTemplate,
  updateMcpArgsEnvs,
} from "@/app/utils/mcp";
import { delay } from "@/app/utils";

let pollingTimer: NodeJS.Timeout | null = null;

const DEFAULT_MCP_STATE = {
  config: null as MCPConfig | null,
  remoteMcpList: [] as TRemoteMcpInfo[],
  renderMcpList: [] as McpItemInfo[],
  mcpRemoteInfoMap: new Map(),
  mcpRenderedMap: new Map(),
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
        const { renderMcpList, mcpRemoteInfoMap, mcpRenderedMap } =
          await getRenderMcpList(config, remoteMcpList);
        const mcpStatusList = await getMcpStatusList(config);
        startPollingMcpStatus();

        set({
          config,
          remoteMcpList,
          renderMcpList,
          mcpRemoteInfoMap,
          mcpRenderedMap,
          mcpStatusList,
        });
        console.log("[Mcp store] init end");
      },

      reCaculateMcpList: async () => {
        console.log("[Mcp store] reCaculateMcpList");
        const remoteMcpList = await getRemoteMcpList();
        const config = await readMcpConfig();
        if (!config) return;

        const { renderMcpList, mcpRemoteInfoMap, mcpRenderedMap } =
          await getRenderMcpList(config, remoteMcpList);
        set({ renderMcpList, mcpRemoteInfoMap, mcpRenderedMap });
      },

      batchUpdateMcpStatusList: async (statusList: McpStatusItem[]) => {
        console.log("[Mcp store] batchUpdateMcpStatusList", statusList);
        const { mcpStatusList } = get();
        const mergedList = [...mcpStatusList, ...statusList];

        const uniqueList = Array.from(
          new Map(mergedList.map((item) => [item.name, item])).values(),
        );

        set({ mcpStatusList: uniqueList });
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
        const hasItem = mcpStatusList.some((item) => item.name === name);
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
          const { aiden_enable, ...other } = server as CustomMCPServer;
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
        try {
          await updateConfig(newConfig);
          const mcpStatusList = await getMcpStatusList(newConfig);
          set({ mcpStatusList });
          const { renderMcpList, mcpRemoteInfoMap } = await getRenderMcpList(
            newConfig,
            remoteMcpList,
          );
          set({ renderMcpList, mcpRemoteInfoMap });
          return true;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      getRemoteMcpStatus: async (name: string) => {
        const { updateMcpStatusList } = _get();
        updateMcpStatusList({ name, action: McpAction.Loading }, "update");
        await delay(500);
        try {
          const newAction = await fetchMcpStatus(name);
          updateMcpStatusList({ name: name, action: newAction }, "update");
        } catch (err) {
          updateMcpStatusList(
            { name: name, action: McpAction.Failed },
            "update",
          );
          console.error(err);
        }
      },
      updateTemplate: async (
        name: string,
        id: string,
        templateInfo: TTemplateInfo,
      ) => {
        console.log("[Mcp store] updateTemplate", name, templateInfo);
        const { config, renderMcpList, mcpRemoteInfoMap, getRemoteMcpStatus } =
          _get();
        if (!config) return;
        let previousConfig = {};
        if (config.mcpServers[name]) {
          previousConfig = {
            ...config.mcpServers[name],
          };
        } else {
          const remoteInfo = mcpRemoteInfoMap.get(id);
          const remoteItem = getFirstValue(remoteInfo?.basic_config) || {};
          previousConfig = {
            ...remoteItem,
            aiden_mcp_version: remoteInfo?.current_version,
            aiden_enable: true,
            aiden_type: "remote",
            aiden_id: remoteInfo.mcp_id,
          };
        }

        const newServer = {
          ...previousConfig,
          aiden_enable: true,
        } as MCPServer;

        if (templateInfo.envs.length) {
          newServer.env = Object.fromEntries(
            templateInfo.envs.map((item) => [item.key, item.value]),
          );
        }
        if (templateInfo.templates.length) {
          newServer.args = replaceTemplate(
            newServer.args,
            templateInfo.templates,
            templateInfo.multiArgs,
          );
        }
        const newConfig = {
          ...config,
          mcpServers: {
            ...config.mcpServers,
            [name]: { ...newServer },
          },
        };
        set({ config: newConfig as MCPConfig });

        const newList = renderMcpList.map((item) => {
          if (item.mcp_key === name) {
            return {
              ...item,
              checked: true,
              templateInfo,
              settingInfo: parseConfig(
                newConfig.mcpServers[name] as CustomMCPServer,
              ),
              local_version: (newConfig.mcpServers[name] as CustomMCPServer)
                ?.aiden_mcp_version,
              remote_version: mcpRemoteInfoMap.get(id)?.current_version || "",
            };
          }
          return item;
        });

        set({ renderMcpList: newList as McpItemInfo[] });
        try {
          await updateConfig(newConfig);
          getRemoteMcpStatus(name);
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      updateMcpArgsEnvs: async (name: string, settingInfo: TSettingInfo) => {
        console.log("[Mcp store] updateMcpArgsEnvs", name, settingInfo);
        const { config, renderMcpList, getRemoteMcpStatus } = _get();
        if (!config) return;
        const newServer = {
          [name]: {
            ...config.mcpServers[name],
          },
        };
        if (settingInfo.envs.length) {
          newServer[name].env = Object.fromEntries(
            settingInfo.envs.map((item) => [item.key, item.value]),
          );
        }
        if (settingInfo.args.length) {
          newServer[name].args = [...settingInfo.args];
        }
        const newConfig = {
          ...config,
          mcpServers: {
            ...config.mcpServers,
            ...newServer,
          },
        };
        set({ config: newConfig });

        const newList = renderMcpList.map((item) => {
          if (item.mcp_key === name) {
            return {
              ...item,
              settingInfo,
            };
          }
          return item;
        });
        set({ renderMcpList: newList as McpItemInfo[] });
        try {
          await updateConfig(newConfig);
          if (config.mcpServers[name].aiden_enable) {
            getRemoteMcpStatus(name);
          }
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      switchMcpStatus: async ({
        id,
        name,
        enable,
        type,
        version,
      }: {
        id: string;
        name: string;
        type: string;
        enable: boolean;
        version: string;
      }) => {
        console.log("[Mcp store] switchMcpStatus: ", name, enable);
        const {
          config,
          updateMcpStatusList,
          mcpRemoteInfoMap,
          renderMcpList,
          getRemoteMcpStatus,
        } = _get();
        if (!config) return;
        let newConfig = { ...config };
        let settingInfo: TSettingInfo | null = null;
        let templateInfo: TTemplateInfo | null = null;
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
                aiden_mcp_version: version,
              },
            },
          };
          settingInfo = parseConfig(newConfig.mcpServers[name]);
          templateInfo = parseTemplate(newConfig.mcpServers[name]);
        }

        set({ config: newConfig });
        const newList = renderMcpList.map?.((item) => {
          if (item.mcp_key === name) {
            return {
              ...item,
              checked: enable,
              settingInfo,
              templateInfo,
              local_version: (newConfig.mcpServers[name] as CustomMCPServer)
                ?.aiden_mcp_version,
              remote_version: mcpRemoteInfoMap.get(id)?.current_version || "",
            };
          }
          return item;
        });
        set({ renderMcpList: newList as McpItemInfo[] });
        try {
          await updateConfig(newConfig);
          if (newConfig.mcpServers[name].aiden_enable) {
            getRemoteMcpStatus(name);
          } else {
            updateMcpStatusList({ name, action: McpAction.Loading }, "delete");
          }
        } catch (e) {
          console.error(e);
        }
      },
      updateLocalMcpVersion: async (
        id: string,
        name: string,
        version: string,
      ) => {
        const { config, renderMcpList, mcpRemoteInfoMap, getRemoteMcpStatus } =
          _get();
        if (!config || !config?.mcpServers[name]) return;
        const localItem = config.mcpServers[name];
        const remoteItem =
          getFirstValue(mcpRemoteInfoMap.get(id)?.basic_config) || {};
        const newArgsEnv = updateMcpArgsEnvs(localItem, remoteItem);
        const newConfig = {
          ...config,
          mcpServers: {
            ...config.mcpServers,
            [name]: {
              ...remoteItem,
              aiden_enable: localItem.aiden_enable,
              aiden_type: localItem.aiden_type,
              aiden_id: id,
              aiden_mcp_version: version,
              ...newArgsEnv,
            },
          },
        };
        set({ config: newConfig });
        const newList = renderMcpList.map((item) => {
          if (item.mcp_key === name) {
            return {
              ...item,
              local_version: version,
              remote_version: mcpRemoteInfoMap.get(id)?.current_version || "",
              settingInfo: parseConfig(newConfig.mcpServers[name]),
            };
          }
          return item;
        });
        set({ renderMcpList: newList });
        if (!localItem.aiden_enable) return;
        try {
          await updateConfig(newConfig);
          if (config.mcpServers[name].aiden_enable) {
            getRemoteMcpStatus(name);
          }
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      removeMcpItem: async (name: string) => {
        console.log("[Mcp store] removeMcpItem: ", name);
        const { config, renderMcpList, updateMcpStatusList } = _get();
        if (!config) return;
        const beforeMcpServers = { ...config.mcpServers };
        delete beforeMcpServers[name];
        const newConfig = {
          ...config,
          mcpServers: { ...beforeMcpServers },
        };
        set({ config: newConfig });
        const newList = renderMcpList.filter((item) => item.mcp_key !== name);
        set({ renderMcpList: newList });
        try {
          await updateConfig(newConfig);
          updateMcpStatusList({ name, action: McpAction.Loading }, "delete");
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      pollMcpStatus: async () => {
        console.log("[Mcp store] pollMcpStatus");
        const { mcpStatusList, batchUpdateMcpStatusList, config } = _get();
        if (!config) return;

        const loadingItems = mcpStatusList.filter(
          (item) => item.action === McpAction.Loading,
        );

        if (loadingItems.length > 0) {
          const serverNames = loadingItems.map((item) => item.name);
          try {
            const statusList = await batchFetchMcpStatus(serverNames);
            const localStatusList = statusList.map((item) => ({
              name: item.server,
              action: item.status,
            }));
            batchUpdateMcpStatusList(localStatusList);
          } catch (err) {
            console.warn(
              `[Mcp store] 轮询 ${serverNames.join(",")} 状态失败`,
              err,
            );
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
