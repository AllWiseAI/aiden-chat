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

export type TemplateItem = { key: string; value: string };
export type MultiArgItem = { key: string; value: string[] };

export function replaceTemplate(
  args: string[] | undefined,
  templates: TemplateItem[],
  multiArgs: MultiArgItem[],
): string[] {
  if (!args) return [];
  const templateMap = Object.fromEntries(
    templates.map((item) => [item.key, item.value]),
  );
  const multiArgMap = Object.fromEntries(
    multiArgs.map((item) => [item.key, item.value]),
  );

  const replacedArgs: string[] = [];

  for (const arg of args) {
    // 处理 multiArgs 格式：完全匹配 []<KEY>
    const multiMatch = arg.match(/^\[\]<([^<>]+)>$/);
    if (multiMatch) {
      const key = multiMatch[1];
      const values = multiArgMap[key];
      if (Array.isArray(values)) {
        replacedArgs.push(...values);
      }
      continue;
    }

    // 替换 <KEY> 模板
    const replaced = arg.replace(
      /<([^<>]+)>/g,
      (_, key) => templateMap[key] ?? "",
    );
    replacedArgs.push(replaced);
  }
  return replacedArgs;
}

export const parseTemplate = (server: CustomMCPServer) => {
  const templateSet = new Map<string, TemplateItem>();
  const multiArgSet = new Map<string, MultiArgItem>();
  const envs: EnvItem[] = [];

  const { args = [], env = {} } = server;

  // 提取 args 中的模板变量 <KEY>
  for (const arg of args) {
    // 普通模板变量，如 "--flag=<SOME_KEY>"
    const matches = arg.matchAll(/<([^<>]+)>/g);
    for (const match of matches) {
      const templateKey = match[1];
      // 跳过 multiArg 语法
      if (/^\[\]/.test(arg)) continue;
      if (!templateSet.has(templateKey)) {
        templateSet.set(templateKey, { key: templateKey, value: "" });
      }
    }

    // 多参数变量：完整形如 "[]<ALLOWED_PATHS>"
    const multiArgMatch = arg.match(/^\[\]<([^<>]+)>$/);
    if (multiArgMatch) {
      const multiArgKey = multiArgMatch[1];
      if (!multiArgSet.has(multiArgKey)) {
        multiArgSet.set(multiArgKey, { key: multiArgKey, value: [] });
      }
    }
  }

  // 提取 env 中的键值对
  for (const [envKey, envValue] of Object.entries(env)) {
    envs.push({ key: envKey, value: envValue });
  }

  return {
    templates: Array.from(templateSet.values()),
    multiArgs: Array.from(multiArgSet.values()),
    envs,
  };
};

export const parseConfig = (server: CustomMCPServer) => {
  let finalArgs: string[] = [];
  const envs: EnvItem[] = [];

  const { args = [], env = {} } = server;
  finalArgs = [...args];
  for (const [envKey, envValue] of Object.entries(env)) {
    envs.push({ key: envKey, value: envValue });
  }
  return {
    args: finalArgs,
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
          mcp_key: name,
          checked: aiden_enable,
          description: "",
          description_en: "",
          description_zh: "",
          tutorial: "",
          tutorial_en: "",
          tutorial_zh: "",
          mcp_logo: "",
          type: aiden_type,
          settingInfo: parseConfig(server as CustomMCPServer),
        });
      } else {
        addedInJSONIds.push(aiden_id);
        items.push({
          ...mcpRemoteInfoMap.get(aiden_id),
          mcp_id: aiden_id,
          mcp_key: name,
          checked: aiden_enable,
          type: "remote",
          settingInfo: parseConfig(server as CustomMCPServer),
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
        mcp_key: Object.keys(item.basic_config)[0],
        checked: false,
        settingInfo: null,
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
