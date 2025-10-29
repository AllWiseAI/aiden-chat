import {
  AgentConfig,
  CustomAgents,
  Agent,
  AgentSource,
  DefaultAgent,
} from "../typing";
import { useAppConfig } from "../store";
import { updateAgentConfig, getRemoteAgentItems } from "@/app/services";
import { toast } from "@/app/utils/toast";
import { invoke } from "@tauri-apps/api/tauri";

export const readAgentConfig = async () => {
  console.log("[Agent store] readAgentConfig");
  const data = await invoke<AgentConfig>("read_agent_config");
  return data;
};

export const updateLocalConfig = async (config: any) => {
  console.log("[Agent store] updateLocalConfig");
  await invoke<AgentConfig>("write_agent_config", { newConfig: config });
  return true;
};

export const getRemoteAgentList = async () => {
  console.log("[Agent store] getRemoteAgentList");
  const remoteMcpItems = await getRemoteAgentItems();
  return remoteMcpItems || [];
};

export const handleRemoteAgentList = (
  configAgents: CustomAgents[],
  remoteAgents: any,
) => {
  const agents = configAgents.filter(
    (item: CustomAgents) => item.source !== AgentSource.Default,
  );

  const defaultAgents = remoteAgents.map((item: DefaultAgent) => {
    const modelInfo = useAppConfig.getState().getModelInfo(item.model);
    const userDefaultAgent = configAgents.find(
      (agent: CustomAgents) => agent.agent_id === item.id,
    );

    return {
      agent_id: item.id,
      agent_name: item.name_en,
      avatar: userDefaultAgent?.avatar ?? item.avatar,
      source: AgentSource.Default,
      description: item.description_en,
      prompt: item.prompt_en,
      enabled: userDefaultAgent?.enabled ?? false,
      agent_type: item.type,
      model_name: item.model,
      model_provider:
        userDefaultAgent?.model_provider ??
        (modelInfo ? modelInfo.provider : ""),
      endpoint:
        userDefaultAgent?.endpoint ?? (modelInfo ? modelInfo.endpoint : ""),
      api_key: userDefaultAgent?.api_key ?? (modelInfo ? modelInfo.apiKey : ""),
    };
  });
  const newAgents = [...agents, ...defaultAgents];
  const formatAgents: Agent[] = newAgents.map((a: any) => ({
    id: a.agent_id,
    name: a.agent_name,
    avatar: a.avatar,
    source: a.source,
    description: a.description,
    prompt: a.prompt,
    type: a.agent_type,
    enabled: a.enabled,
    model: {
      name: a.model_name,
      provider: a.model_provider,
      endpoint: a.endpoint,
      apiKey: a.api_key || undefined,
    },
  }));
  const renderAgents = formatAgents.sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    const order = {
      [AgentSource.BuiltIn]: 0,
      [AgentSource.Default]: 1,
      [AgentSource.Custom]: 2,
    };

    return order[a.source] - order[b.source];
  });
  return {
    agents: [...agents, ...defaultAgents],
    renderAgents,
  };
};

export const updateConfig = async (config: any) => {
  console.log("[Agent store] updateConfig", config);
  try {
    const res = await updateLocalConfig(config);
    console.log("[Agent store] updateLocalConfig result:", res);
    if (res) {
      console.log("[Agent store] updateRemoteAgentConfig");
      await updateAgentConfig();
    } else {
      console.log("Failed to write local agent.config.json", res);
    }
  } catch (e: any) {
    console.log("Failed to update config", e);
    toast.error("Failed to update config. " + e);
    throw new Error(e);
  }
};

export const formatAgents = (agents: Agent[]) => {
  return agents.map((a: Agent) => ({
    agent_id: a.id,
    agent_name: a.name,
    avatar: a.avatar,
    source: a.source,
    description: a.description,
    prompt: a.prompt,
    agent_type: a.type,
    enabled: a.enabled,
    model_name: a.model.name,
    model_provider: a.model.provider,
    endpoint: a.model.endpoint,
    api_key: a.model.apiKey ?? "",
  }));
};
