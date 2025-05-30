import { useEffect, useMemo, useRef } from "react";
import useState from "react-usestateref";
import { invoke } from "@tauri-apps/api/tauri";
import { updateMcpConfig, getRemoteMcpItems } from "@/app/services";
import lodash from "lodash";
import {
  McpItemInfo,
  TRemoteMcpInfo,
  MCPServer,
  CustomMCPServer,
  MCPConfig,
} from "@/app/typing";

const isEmptyObject = (obj: any) => {
  return Object.keys(obj).length === 0;
};

export function useMcpConfig() {
  const [config, setConfig, configRef] = useState<MCPConfig | null>(null);
  const [defaultMcpNames, setDefaultMcpNames] = useState<string[]>([]);
  const initialSortedItemsRef = useRef<McpItemInfo[]>();
  const [remoteItems, setRemoteItems] = useState<TRemoteMcpInfo[]>([]);

  const disableList = useMemo(() => {
    if (!config) return [];
    return Object.entries(config.mcpServers)
      .filter(
        ([, server]) => (server as CustomMCPServer).aiden_enable === false,
      )
      .map(([name]) => name);
  }, [config]);

  useEffect(() => {
    if (!configRef.current) return;
    const filteredConfig = restoreServers({ ...filteredServers });
    const isEqual = lodash.isEqual(config?.mcpServers, filteredConfig);
    // 相等说明启动触发，不应该调用接口
    if (isEqual) return;
    const newConfig = { ...config, mcpServers: { ...filteredServers } };
    const updateConfig = async () => {
      // 调用接口
      await updateMcpConfig(newConfig);
    };

    updateConfig();
  }, [disableList]);

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
            showDelete: aiden_type === "custom",
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
    if (config && remoteItems.length) {
      if (!initialSortedItemsRef.current) {
        const sorted = items.sort((a, b) => {
          // 先 checked 的排前面；相同则按 mcp_name 升序
          if (a.checked !== b.checked) return a.checked ? -1 : 1;
          return a.mcp_name.localeCompare(b.mcp_name);
        });
        initialSortedItemsRef.current = sorted;
        return initialSortedItemsRef.current;
      } else {
        const latestItemsMap = new Map(
          items.map((item) => [item.mcp_id, item]),
        );

        const reordered = initialSortedItemsRef.current
          .map((cachedItem) => latestItemsMap.get(cachedItem.mcp_id))
          .filter(Boolean) as McpItemInfo[];

        return reordered;
      }
    }
    return [];
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
  }

  // UserConfig => McpServer
  function restoreServers(newConfig: Record<string, MCPServer>) {
    const updatedConfig: Record<string, CustomMCPServer> = {};
    Object.entries(newConfig).forEach(([name, server]) => {
      updatedConfig[name] = {
        ...server,
        aiden_enable: !disableList.includes(name),
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
      // no need to await this function to back to table
      const fetchConfig = { ...config, mcpServers: { ...filteredServers } };
      updateMcpConfig(fetchConfig);
      return true;
    } catch (e: any) {
      throw new Error(e);
    }
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
      return true;
    } catch (e: any) {
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
    } catch (e: any) {
      throw new Error(e);
    }
  };

  return {
    config,
    disableList,
    saveConfig,
    switchDisable,
    mcpItemsList,
    delMcpItem,
    filteredServers,
  };
}
