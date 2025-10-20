import { AgentConfig, Agent } from "../typing";
import { updateAgentConfig } from "@/app/services";
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
