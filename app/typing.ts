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

export enum McpAction {
  Loading = "loading",
  Connected = "connected",
  Failed = "failed",
}

export type batchMcpStatusResp = {
  server: string;
  status: McpAction;
  tools: [];
};

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
  aiden_credential?: AidenCredential;
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
  aiden_credential?: AidenCredential;
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
  aiden_credential?: AidenCredential;
};

export type AidenCredential = {
  type: "oauth" | "password";
  service?: string;
  scopes?: [];
  providers?: [];
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

export type ModelOption = {
  display: string;
  model: string;
  multi_model: boolean;
  is_default: boolean;
  is_summary: boolean;
  id: number;
  endpoint: string;
  provider: string;
  value: string;
  label: string;
  logo_uri: null | string;
};

export type CustomModelOption = {
  value: string;
  label: string;
};

export type ProviderOption = {
  endpoint?: string;
  multi_model?: boolean;
  support_pdf?: boolean;
  itemId: string;
  protocol: string;
  provider: string;
  default_endpoint: boolean;
  id: number;
  models_path: string;
  logo_uri: null | string;
  enabled: boolean;
  headers: Record<string, string>;
  display: string;
  model?: string;
  models: CustomModelOption[];
  apiKey?: string;
};

export type ChatModelInfo = {
  provider: string;
  default_endpoint?: string;
  apiKey?: string;
  model: string;
  endpoint?: string;
};

export type OpenAIModelOptions = {
  id: string;
};

export type AnthropicModelOptions = {
  id: string;
  display_name: string;
};

export type GeminiModelOptions = {
  name: string;
  displayName: string;
};

export type ModelHeaderInfo = {
  "Aiden-Model-Name": string;
  "Aiden-Endpoint": string;
  "Aiden-Model-Provider": string;
  "Aiden-Model-Api-Key"?: string;
};

export interface Task {
  id: string;
  name: string;
  original_info: {
    name: string;
    start_date: string;
    hour: number | null;
    minute: number | null;
    repeat_unit: string;
    enable_notification: boolean;
    description: string;
  };
  modelInfo?: ProviderOption;
  model_info: ModelHeaderInfo;
  created_at: string;
  updated_at: string;
  show_unread: boolean;
  next_run_time: string | null;
}

export type TaskFormType = {
  modelInfo?: ProviderOption;
  name: string;
  date: string;
  hour: number | null;
  minute: number | null;
  type: TaskTypeEnum;
  notification: boolean;
  details: string;
};

export enum TaskTypeEnum {
  Once = "once",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
}

export enum TaskAction {
  Success = "success",
  Pending = "pending",
  Failed = "failed",
  Idle = "idle",
}

export type TaskExecutionRecord = {
  task_id: string;
  status: string;
  created_at: string;
  completed_at: string;
  next_run_at: string | null;
  response_data: {
    message: {
      role: MessageRole;
      message: string;
    };
  };
  request_messages: {
    role: MessageRole;
    message: string;
  }[];
  id: number;
};

export type taskSessionParams = {
  taskId: string;
  modelInfo: ProviderOption;
  requestData: {
    role: MessageRole;
    content: string;
    date: string;
  }[];
  responseData: {
    role: MessageRole;
    content: string;
  }[];
};

export interface TaskPayload {
  task_id?: string;
  description: string;
  repeat_every: number;
  repeat_unit: string;
  start_date: string; // Assuming date is stored as string, adjust to Date if needed
  enable_notification: boolean;
  hour: number | null;
  minute: number | null;
  name: string;
  repeat_on?: {
    weekdays?: string[];
    days_of_month?: number[];
  };
}

export type AccountItem = {
  service: string;
  account: string;
};

export type OauthAccounts = AccountItem[];
