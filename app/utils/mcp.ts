import {
  updateMcpConfig as updateRemoteMcpConfig,
  getRemoteMcpItems,
  searchMcpServerStatus,
  getMcpStatuses,
} from "@/app/services";
import {
  McpItemInfo,
  TRemoteMcpInfo,
  CustomMCPServer,
  MCPConfig,
  MCPServer,
  McpAction,
  EnvItem,
  batchMcpStatusResp,
} from "@/app/typing";
import { invoke } from "@tauri-apps/api/tauri";
import { toast } from "@/app/utils/toast";

export type TemplateItem = { key: string; value: string };
export type MultiArgItem = { key: string; value: string[] };

/**
 * 填充 args 中的 KEY=<VAL> []<KEY> 模板
 * @param oldArgs 
 * @param newTemplate 
 * @returns 
 * @example
  const oldArgs = [
    "-y",
    "@modelcontextprotocol/server-filesystem@2025.3.28",
    "--from=123",
    "token=abc",
    "free-value"
  ];

  const newArgsTemplate = [
    "-y",
    "@modelcontextprotocol/server-filesystem@2025.3.29",
    "--from=<from>",
    "token=<token>",
    "[]<freeval>"
  ];

    console.log(fillFlexibleArgs(oldArgs, newArgsTemplate));

    Output:

    [
      '-y',
      '@modelcontextprotocol/server-filesystem@2025.3.29',
      '--from=123',
      '--token=abc',
      'free-value'
    ]
 */
function fillFlexibleArgs(oldArgs: string[], newArgs: string[]) {
  if (!oldArgs.length) return newArgs;
  if (!newArgs.length) return [];
  const keyValueMap: Record<string, string> = {};
  const freeValues: string[] = [];

  for (const arg of oldArgs) {
    if (arg.includes("=")) {
      // 去掉开头的 -- 或 - 之类的前缀
      const cleanedArg = arg.replace(/^-+/, "");
      const [key, val] = cleanedArg.split("=");
      keyValueMap[key] = val;
    } else if (!arg.startsWith("-") && !arg.includes("@")) {
      freeValues.push(arg);
    }
  }

  const result = [];

  for (const arg of newArgs) {
    const keyValMatch = arg.match(/^([-\w]*)=?<(\w+)>$/);
    const freeValMatch = arg.match(/^\[\]<(\w+)>$/);

    if (keyValMatch) {
      const [, keyPrefix, placeholder] = keyValMatch;
      const val = keyValueMap[placeholder];
      result.push(val !== undefined ? `${keyPrefix}=${val}` : arg);
    } else if (freeValMatch && freeValues.length > 0) {
      result.push(...freeValues);
    } else {
      result.push(arg);
    }
  }

  return result;
}

export function checkShowTemplateModal(
  config: MCPConfig | null,
  mcpItem: McpItemInfo,
) {
  if (!config) {
    return {
      templateInfo: null,
      shouldShowTemplateModal: false,
    };
  }
  let templateInfo = null;
  if (config?.mcpServers[mcpItem.mcp_key]) {
    templateInfo = parseTemplate(config.mcpServers[mcpItem.mcp_key]);
  } else {
    const server = getFirstValue(mcpItem.basic_config || {});
    if (server) {
      templateInfo = parseTemplate(server as CustomMCPServer);
    }
  }

  if (!templateInfo) {
    return {
      templateInfo: null,
      shouldShowTemplateModal: false,
    };
  }

  const { templates, envs, multiArgs } = templateInfo;
  const emptyEnvs = envs?.filter((env) => env.value === "");

  let shouldShowTemplateModal = false;
  if (templates?.length || emptyEnvs?.length || multiArgs?.length) {
    shouldShowTemplateModal = true;
  }

  return {
    templateInfo,
    shouldShowTemplateModal,
  };
}

export function updateMcpArgsEnvs(localItem: MCPServer, remoteItem: MCPServer) {
  const { args = [], env = {} } = remoteItem;
  const { args: localArgs = [], env: localEnv = {} } = localItem;
  const newArgs = fillFlexibleArgs(localArgs, args);
  const newEnv = { ...env, ...localEnv };

  return {
    args: newArgs,
    env: newEnv,
  };
}

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
    console.error("[fetchMcpStatus]", e);
    return McpAction.Failed;
  }
};
export const batchFetchMcpStatus = async (
  names: string[],
): Promise<batchMcpStatusResp[]> => {
  try {
    const res = (await getMcpStatuses(names)) as any;
    if (!res || !res?.data) {
      throw new Error("No data");
    }
    const { data } = res;
    if (data?.length) return data;
    else throw new Error("No status");
  } catch (e) {
    console.error("[batchFetchMcpStatus]", e);
    return [];
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

  const list = await batchFetchMcpStatus(enableList);
  const mcpStatusList = list.map((item) => ({
    name: item.server,
    action: item.status,
  }));
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
  const mcpRenderedMap = new Map();
  for (const item of remoteMcpList) {
    mcpRemoteInfoMap.set(item.mcp_id, item);
  }
  if (config?.mcpServers) {
    Object.entries(config.mcpServers).forEach(([name, server]) => {
      const {
        aiden_type,
        aiden_enable,
        aiden_id,
        aiden_mcp_version,
        aiden_credential,
      } = server as CustomMCPServer;
      if (!mcpRemoteInfoMap.has(aiden_id)) {
        items.push({
          mcp_id: aiden_id,
          mcp_name: name,
          mcp_key: name,
          checked: aiden_enable,
          current_version: "",
          local_version: aiden_mcp_version || "",
          remote_version: "",
          description: "",
          description_en: "",
          description_zh: "",
          tutorial: "",
          tutorial_en: "",
          tutorial_zh: "",
          mcp_logo: "",
          type: aiden_type,
          settingInfo: parseConfig(server as CustomMCPServer),
          aiden_credential: aiden_credential,
        });
        mcpRenderedMap.set(name, { icon: "", renderName: name });
      } else {
        addedInJSONIds.push(aiden_id);
        const item = mcpRemoteInfoMap.get(aiden_id);
        mcpRenderedMap.set(name, {
          icon: item.mcp_logo,
          renderName: item.mcp_name,
        });
        items.push({
          ...item,
          mcp_id: aiden_id,
          mcp_key: name,
          checked: aiden_enable,
          type: aiden_type,
          local_version: aiden_mcp_version || "",
          remote_version: item.current_version || "",
          settingInfo: parseConfig(server as CustomMCPServer),
        });
      }
    });
  }

  for (const item of remoteMcpList) {
    if (
      !addedInJSONIds.includes(item.mcp_id) &&
      item.mcp_id &&
      !isEmptyObject(item.basic_config)
    ) {
      items.push({
        ...item,
        type: "remote",
        mcp_key: Object.keys(item.basic_config)[0],
        local_version: "",
        remote_version: item.current_version || "",
        checked: false,
        settingInfo: null,
      });
      mcpRenderedMap.set(Object.keys(item.basic_config)[0], {
        icon: item.mcp_logo,
        renderName: item.mcp_name,
      });
    }
  }

  const sortedItems = items.sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? -1 : 1;
    }
    return a.mcp_name > b.mcp_name ? 1 : a.mcp_name < b.mcp_name ? -1 : 0;
  });

  return {
    mcpRenderedMap,
    mcpRemoteInfoMap,
    renderMcpList: sortedItems,
  };
};

export const updateLocalConfig = async (config: any) => {
  console.log("[Mcp store] updateLocalConfig");
  await invoke<MCPConfig>("write_mcp_config", { newConfig: config });
  return true;
};

export const updateConfig = async (newConfig: any) => {
  console.log("[Mcp store] updateConfig", newConfig);
  try {
    const res = await updateLocalConfig(newConfig);
    console.log("[Mcp store] updateLocalConfig result:", res);
    if (res) {
      console.log("[Mcp store] updateRemoteMcpConfig");
      await updateRemoteMcpConfig(newConfig);
    } else {
      console.log("Failed to write local mcp.config.json", res);
    }
  } catch (e: any) {
    console.log("Failed to update config", e);
    toast.error("Failed to update config. " + e);
    throw new Error(e);
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
      aiden_id: config?.mcpServers[name]?.aiden_id || name,
      aiden_type: config?.mcpServers[name]?.aiden_type || "custom",
      aiden_mcp_version: config?.mcpServers[name]?.aiden_mcp_version || "",
    };
  });
  return updatedConfig;
};
