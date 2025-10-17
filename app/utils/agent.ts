import { AgentConfig } from "../typing";
import { invoke } from "@tauri-apps/api/tauri";

export const readAgentConfig = async () => {
  console.log("[Mcp store] readMcpConfig");
  const data = await invoke<AgentConfig>("read_agent_config");
  return data;
};
