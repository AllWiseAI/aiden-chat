import {
  updateMcpConfig as updateRemoteMcpConfig,
  getRemoteMcpItems,
  searchMcpServerStatus,
} from "@/app/services";
import {
  McpItemInfo,
  TRemoteMcpInfo,
  CustomMCPServer,
  MCPConfig,
  MCPServer,
  McpAction,
  EnvItem,
} from "@/app/typing";
import { invoke } from "@tauri-apps/api/tauri";

export function replaceArgsPlaceholders(
  args: string[],
  templates: Record<string, string>[],
): string[] {
  return args.map((arg) => {
    const match = arg.match(/<([^>]+)>/);
    if (match) {
      const placeholderKey = match[1];
      const replacement = templates.find((r) => r.key === placeholderKey);
      if (replacement) {
        return arg.replace(`<${placeholderKey}>`, replacement.value);
      }
    }
    return arg;
  });
}

export interface EnvItem {
  key: string;
  value: string;
}

export interface TemplateItem {
  key: string;
  value: string;
}

export interface MultiArgItem {
  key: string;
  value: string[];
}

export const parseConfig = (
  base_config: Record<string, { args: string[]; env: Record<string, string> }>,
) => {
  const templateKeys = new Set<string>();
  const multiArgKeys = new Set<string>();
  const envs: EnvItem[] = [];

  for (const key in base_config) {
    const { args = [], env = {} } = base_config[key];

    for (const arg of args) {
      // 检查是否为 multi args 格式：[]<KEY>
      const multiArgMatch = arg.match(/\[\]<([^<>]+)>/);
      if (multiArgMatch) {
        multiArgKeys.add(multiArgMatch[1]);
        continue;
      }

      // 普通模板格式：<KEY>
      const templateMatches = arg.matchAll(/<([^<>]+)>/g);
      for (const match of templateMatches) {
        templateKeys.add(match[1]);
      }
    }

    for (const [envKey, envValue] of Object.entries(env)) {
      envs.push({ key: envKey, value: envValue });
    }
  }

  const templates: TemplateItem[] = Array.from(templateKeys).map((key) => ({
    key,
    value: "",
  }));

  const multiArgs: MultiArgItem[] = Array.from(multiArgKeys).map((key) => ({
    key,
    value: [],
  }));

  return {
    templates,
    multiArgs,
    envs,
  };
};

export const fetchMcpStatus = async (name: string): Promise<McpAction> => {
  try {
    const res = (await searchMcpServerStatus(name)) as any;
    if (!res || !res?.data) {
      throw new Error("No data");
    }
    const { data } = res;
    if (data.status) return data.status;
    else throw new Error("No status");
  } catch (e) {
    return McpAction.Failed;
  }
};

export const isEmptyObject = (obj: any) => {
  return Object.keys(obj).length === 0;
};

export const getFirstValue = <T extends Record<string, any>>(
  obj: T,
): T[keyof T] | undefined => {
  console.log("getFirstValue", obj);
  const firstKey = Object.keys(obj)[0];
  return firstKey ? obj[firstKey] : undefined;
};

export const getMcpStatusList = async (config: MCPConfig) => {
  if (!config) return;
  const enableList = Object.keys(config.mcpServers || {}).filter((name) => {
    const item = config.mcpServers[name];
    return item.aiden_enable;
  });
  const mcpStatusList = await Promise.all(
    enableList.map(async (name) => {
      const status = await fetchMcpStatus(name);
      return { name, action: status };
    }),
  );
  return mcpStatusList;
};

export const readMcpConfig = async () => {
  console.log("[Mcp store] readMcpConfig");
  const data = await invoke<MCPConfig>("read_mcp_config");
  return data;
};

export const getRemoteMcpList = async () => {
  console.log("[Mcp store] getRemoteMcpList");
  const remoteMcpItems = (await getRemoteMcpItems()) as TRemoteMcpInfo[];
  return remoteMcpItems || [];
};

export const getRenderMcpList: any = async (
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
          settingInfo: null,
        });
      } else {
        addedInJSONIds.push(aiden_id);
        items.push({
          ...mcpRemoteInfoMap.get(aiden_id),
          mcp_id: aiden_id,
          mcp_name: name,
          checked: aiden_enable,
          type: "remote",
          settingInfo: parseConfig(
            mcpRemoteInfoMap.get(aiden_id)?.basic_config || {},
          ),
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
        settingInfo: parseConfig(
          mcpRemoteInfoMap.get(item.mcp_id)?.basic_config || {},
        ),
      });
    }
  }

  return {
    mcpRemoteInfoMap,
    renderMcpList: items,
  };
};

export const updateLocalConfig = async (config: any) => {
  console.log("[Mcp store] updateLocalConfig");
  try {
    await invoke<MCPConfig>("write_mcp_config", { newConfig: config });
    return true;
  } catch (e: any) {
    throw new Error(e);
  }
};

export const updateConfig = async (newConfig: any) => {
  console.log("[Mcp store] updateConfig", newConfig);
  try {
    let res = await updateLocalConfig(newConfig);
    console.log("[Mcp store] updateLocalConfig", res);
    if (res) {
      console.log("[Mcp store] updateRemoteMcpConfig");
      await updateRemoteMcpConfig(newConfig);
    } else {
      console.log("Failed to write local mcp.config.json", res);
    }
  } catch (e: any) {
    console.log("Failed to write local mcp.config.json", e);
  }
};

export const restoreServers = (
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
