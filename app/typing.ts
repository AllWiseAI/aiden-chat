export type Updater<T> = (updater: (value: T) => void) => void;

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export interface RequestMessage {
  role: MessageRole;
  content: string;
}

export type DalleSize = "1024x1024" | "1792x1024" | "1024x1792";
export type DalleQuality = "standard" | "hd";
export type DalleStyle = "vivid" | "natural";

export type ModelSize =
  | "1024x1024"
  | "1792x1024"
  | "1024x1792"
  | "768x1344"
  | "864x1152"
  | "1344x768"
  | "1152x864"
  | "1440x720"
  | "720x1440";

export type McpConfigKey = "table" | "edit" | "detail";

export type TDetailInfo = {
  mcp_id: string;
  mcp_name: string;
  mcp_logo: string;
  description: string;
  tutorial: string;
  checked: boolean;
  type: "json" | "remote";
};

export enum McpAction {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Failed = "failed",
}

export type MCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
};

export type CustomMCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
  aiden_type: string;
  aiden_enable: boolean;
  aiden_id: string;
};

export type TRemoteMcpInfo = {
  basic_config: Record<string, MCPServer>;
  description: string;
  tutorial: string;
  mcp_logo: string;
  mcp_name: string;
  mcp_id: string;
  description_en: string;
  description_zh: string;
  tutorial_en: string;
  tutorial_zh: string;
  type: string;
};

export type EnvItem = { key: string; value: string };

export type TSettingInfo = {
  templates: Record<string, string>[];
  envs: EnvItem[];
};

export type McpItemInfo = Omit<
  TRemoteMcpInfo,
  | "basic_config"
  | "description_en"
  | "description_zh"
  | "tutorial_zh"
  | "tutorial_en"
> & {
  basic_config?: Record<string, MCPServer>;
  showDelete: boolean;
  type: "json" | "remote";
  checked: boolean;
  description_en?: string;
  description_zh?: string;
  tutorial_zh?: string;
  tutorial_en?: string;
  settingInfo: TSettingInfo;
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
  mcpServers: Record<string, CustomMCPServer>;
  a2aServers: A2AConfig;
};

export enum McpStepsAction {
  ToolCallConfirm = "tool_call_confirm",
  ToolResult = "tool_result",
}
