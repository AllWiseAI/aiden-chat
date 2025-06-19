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

export type McpItemType = "default" | "custom" | "remote";

export type TDetailInfo = {
  mcp_id: string;
  mcp_name: string;
  mcp_key: string;
  mcp_logo: string;
  description: string;
  tutorial: string;
  checked: boolean;
  description_en?: string;
  description_zh?: string;
  tutorial_zh?: string;
  tutorial_en?: string;
  type: McpItemType;
  current_version: string;
};

export enum McpAction {
  Loading = "loading",
  Connected = "connected",
  Failed = "failed",
}

export type McpStatusItem = {
  name: string;
  action: McpAction;
};

export type MCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
};

export type CustomMCPServer = {
  url?: string;
  transport?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  aiden_type: McpItemType;
  aiden_enable: boolean;
  aiden_id: string;
  aiden_mcp_version?: string;
};

export type TRemoteMcpInfo = {
  basic_config: Record<string, MCPServer>;
  description: string;
  tutorial: string;
  mcp_logo: string;
  mcp_name: string;
  mcp_key: string;
  mcp_id: string;
  description_en: string;
  description_zh: string;
  tutorial_en: string;
  tutorial_zh: string;
  type: string;
  current_version: string;
};

export type EnvItem = { key: string; value: string };
export type TemplateItem = { key: string; value: string };
export type MultiArgItem = { key: string; value: string[] };

export type TSettingInfo = {
  args: string[];
  envs: EnvItem[];
};

export type TTemplateInfo = {
  templates: TemplateItem[];
  multiArgs: MultiArgItem[];
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
  type: McpItemType;
  checked: boolean;
  description_en?: string;
  description_zh?: string;
  tutorial_zh?: string;
  tutorial_en?: string;
  settingInfo: TSettingInfo | null;
  local_version: string;
  remote_version: string;
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

export interface TokenType {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface User {
  id: number;
  email: string;
  profile: string;
}

type LoginSuccessResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  profile_image_url: string;
  id: number;
};

type LoginErrorResponse = {
  error: string;
};

type RefreshSuccessResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
};

type RefreshErrorResponse = {
  error: string;
};

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;
export type RefreshResponse = RefreshSuccessResponse | RefreshErrorResponse;
