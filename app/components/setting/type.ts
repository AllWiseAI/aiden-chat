export type McpConfigKey = "table" | "edit" | "detail";

export type TDetailInfo = {
  name: string;
  mcp_logo: string;
  description: string;
  tutorial: string;
  checked: boolean;
};

export enum McpAction {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
}

export type MCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
  aiden_type?: string;
  aiden_enable?: boolean;
};

export type TRemoteMcpInfo = {
  basic_config: Record<string, MCPServer>;
  description: string;
  tutorial: string;
  mcp_logo: string;
  name: string;
  id: number;
  checked?: boolean;
};

export type A2AServer = {
  name: string;
  url: string;
};

export type A2AConfig = {
  a2aServers: A2AServer[];
};

export type MCPConfig = {
  version: string;
  mcpServers: Record<string, MCPServer>;
  a2aServers: A2AConfig;
};
