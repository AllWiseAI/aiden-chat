import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  updateMcpConfig,
  getRemoteMcpItems,
  disableMcpServers,
  searchMcpServerStatus,
} from "@/app/services";

import {
  McpItemInfo,
  TRemoteMcpInfo,
  MCPServer,
  CustomMCPServer,
  MCPConfig,
  McpAction,
} from "@/app/typing";

const isEmptyObject = (obj: any) => {
  return Object.keys(obj).length === 0;
};

export function useMcpConfig() {
  const [config, setConfig] = useState<MCPConfig | null>(null);
  const [defaultMcpNames, setDefaultMcpNames] = useState<string[]>([]);
  const [disabledList, setDisabledList] = useState<string[]>([]);
  // 状态映射: 每个server的状态
  const [statusMap, setStatusMap] = useState<Record<string, McpAction>>({});
  const [remoteItems, setRemoteItems] = useState<TRemoteMcpInfo[]>([]);

  const mcpLocalJSONIds = useMemo(() => {
    if (!config) return [];
    const local_ids: string[] = [];
    Object.entries(config.mcpServers).forEach(([name, server]) => {
      local_ids.push((server as CustomMCPServer).aiden_id);
    });
    return local_ids;
  }, [config]);

  const mcpRemoteItemConfig = useMemo(() => {
    let remoteConfig: Record<string, MCPServer> = {};
    for (let item of remoteItems) {
      const { basic_config, mcp_id } = item;
      if (mcp_id && !isEmptyObject(basic_config)) {
        Object.entries(basic_config).forEach(([name, server]) => {
          remoteConfig[mcp_id] = { ...server };
        });
      }
    }
    return remoteConfig;
  }, [remoteItems]);

  const mcpRemoteItemInfo = useMemo(() => {
    let remoteInfo: Record<string, TRemoteMcpInfo> = {};
    for (let item of remoteItems) {
      remoteInfo[item.mcp_id] = { ...item };
    }
    return remoteInfo;
  }, [remoteItems]);

  // For table list show
  // includes all the mcp servers information
  const mcpItemsList = useMemo(() => {
    const items: McpItemInfo[] = [];
    const addedInJSONIds: string[] = [];
    if (config?.mcpServers) {
      Object.entries(config.mcpServers).forEach(([name, server]) => {
        const { aiden_type, aiden_enable, aiden_id } =
          server as CustomMCPServer;
        if (!mcpRemoteItemConfig[aiden_id]) {
          // if not in remote list, this is the one user added.
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
            type: "json",
            showDelete: aiden_type === "default" || aiden_type === "custom",
          });
        } else {
          addedInJSONIds.push(aiden_id);
          items.push({
            ...mcpRemoteItemInfo[aiden_id],
            mcp_id: aiden_id,
            mcp_name: name,
            checked: aiden_enable,
            type: "json",
            showDelete: false,
          });
        }
      });
    }
    for (let item of remoteItems) {
      if (
        !addedInJSONIds.includes(item.mcp_id) &&
        item.mcp_id &&
        !isEmptyObject(item.basic_config)
      ) {
        items.push({
          ...item,
          type: "remote",
          checked: false,
          showDelete: false,
        });
      }
    }
    return items;
  }, [config, mcpRemoteItemConfig, mcpRemoteItemInfo, remoteItems]);

  // used for editor
  const filteredServers = useMemo(() => {
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
  }, [config]);

  useEffect(() => {
    async function fetchRemoteItems() {
      const remoteMcpItems = (await getRemoteMcpItems()) as TRemoteMcpInfo[];
      setRemoteItems(remoteMcpItems || []);
    }
    fetchRemoteItems();
  }, []);

  // MCPConfig => filteredMcpServer
  function filterServers(servers: Record<string, CustomMCPServer>) {
    const defaults: string[] = [];
    const disabled: string[] = [];
    Object.entries(servers).forEach(([name, server]) => {
      server.aiden_type === "default" && defaults.push(name);
      server.aiden_enable === false && disabled.push(name);
    });
    setDefaultMcpNames(defaults);
    setDisabledList(disabled);
  }

  // UserConfig => McpServer
  function restoreServers(newConfig: Record<string, MCPServer>) {
    const updatedConfig: Record<string, CustomMCPServer> = {};
    Object.entries(newConfig).forEach(([name, server]) => {
      updatedConfig[name] = {
        ...server,
        aiden_enable: !disabledList.includes(name),
        aiden_id: config?.mcpServers[name]?.aiden_id || "",
        aiden_type: config?.mcpServers[name]?.aiden_type || "custom",
      };
    });
    setDefaultMcpNames([]);
    return updatedConfig;
  }
  // 读取配置 + 初始化
  useEffect(() => {
    const init = async () => {
      // 读取用户 mcp 配置
      const data = await invoke<MCPConfig>("read_mcp_config");
      // 过滤 config.mcpServer 中的 enable 与type
      filterServers(data.mcpServers);
      setConfig(data);

      // 初始化 statusMap 为 Disconnected
      const initStatus: Record<string, McpAction> = {};
      Object.keys(data.mcpServers).forEach((n) => {
        initStatus[n] = McpAction.Disconnected;
      });
      setStatusMap(initStatus);

      // 基于禁用列表请求接口更新状态
      const enabledNames = Object.keys(data.mcpServers).filter(
        (name) => !disabledList.includes(name),
      );

      // 更新非禁用的状态
      await Promise.all(
        enabledNames.map(async (name) => {
          try {
            setStatusMap((m) => ({
              ...m,
              [name]: McpAction.Connecting,
            }));
            const { data } = (await searchMcpServerStatus(name)) as any;
            setStatusMap((m) => ({
              ...m,
              [name]:
                data?.status === "connected"
                  ? McpAction.Connected
                  : McpAction.Disconnected,
            }));
          } catch {
            setStatusMap((m) => ({
              ...m,
              [name]: McpAction.Disconnected,
            }));
          }
        }),
      );
    };
    init();
  }, []);

  const saveConfig = async (newServers: Record<string, MCPServer>) => {
    if (!config) return false;

    const updatedMcpServers = restoreServers(newServers);
    const newConfig = { ...config, mcpServers: { ...updatedMcpServers } };
    setConfig(newConfig);

    try {
      await invoke<MCPConfig>("write_mcp_config", { newConfig });
      // 调用更新接口
      const { version, ...noVersionConfig } = config;
      // no need to await this function to back to table
      updateMcpConfig({ ...noVersionConfig });
      return true;
    } catch (e: any) {
      console.error("Failed to save config:", e);
      throw new Error(e);
    }
  };

  const updateDisableStatus = async (name: string, isDel: boolean) => {
    if (!config) return;
    if (isDel) {
      // delete
      setDisabledList((list) => list.filter((item) => item !== name));
      setStatusMap((m) => {
        const { [name]: _, ...rest } = m;
        return rest;
      });
    } else {
      // disable
      setStatusMap((m) => ({ ...m, [name]: McpAction.Disconnected }));
      setDisabledList((list) => [...list, name]);
    }
    await disableMcpServers(disabledList);
  };

  const switchDisable = async (
    mcp_id: string,
    mcp_name: string,
    enable: boolean,
  ) => {
    if (!config) return;
    let newConfig;

    if (enable && !mcpLocalJSONIds.includes(mcp_id)) {
      // just add this server to config.json
      newConfig = {
        ...config,
        mcpServers: {
          ...config.mcpServers,
          [mcp_name]: {
            ...(mcpRemoteItemConfig as Record<string, MCPServer>)[mcp_id],
            aiden_enable: enable,
            aiden_id: mcp_id,
            aiden_type: "remote",
          },
        },
      };
      setConfig(newConfig);
    } else {
      newConfig = {
        ...config,
        mcpServers: {
          ...config.mcpServers,
          [mcp_name]: {
            ...config.mcpServers[mcp_name],
            aiden_enable: enable,
          },
        },
      };
      setConfig(newConfig);
    }
    try {
      await invoke<MCPConfig>("write_mcp_config", { newConfig });
      if (!enable) {
        // disable
        updateDisableStatus(mcp_name, false);
      } else {
        setDisabledList((list) => list.filter((item) => item !== mcp_name));
        await disableMcpServers(disabledList);
        setStatusMap((m) => ({
          ...m,
          [mcp_name]: McpAction.Connecting,
        }));
        const { data } = (await searchMcpServerStatus(mcp_name)) as any;
        setStatusMap((m) => ({
          ...m,
          [mcp_name]:
            data?.status === "connected"
              ? McpAction.Connected
              : McpAction.Disconnected,
        }));
      }
      return true;
    } catch (e: any) {
      setStatusMap((m) => ({ ...m, [mcp_name]: McpAction.Disconnected }));
      throw new Error(e);
    }
  };

  const delMcpItem = async (mcp_id: string, mcp_name: string) => {
    if (!config) return;
    let beforeMcpServers = { ...config.mcpServers };
    delete beforeMcpServers[mcp_name];
    const newConfig = {
      ...config,
      mcpServers: { ...beforeMcpServers },
    };
    setConfig(newConfig);
    try {
      await invoke<MCPConfig>("write_mcp_config", { newConfig });
      // delete
      updateDisableStatus(mcp_name, true);
    } catch (e: any) {
      throw new Error(e);
    }
  };

  return {
    config,
    disabledList,
    statusMap,
    setStatusMap,
    saveConfig,
    switchDisable,
    mcpItemsList,
    delMcpItem,
    filteredServers,
  };
}
