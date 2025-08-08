import { ChatMessageTool } from "../store";
import { ChatGPTApi } from "./platforms/openai";
import { ProviderOption } from "../typing";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface MultimodalContentForAlibaba {
  text?: string;
  image?: string;
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
  mcpInfo?: {
    title: string;
    request: string;
    response: string[];
  };
}

export interface LLMConfig {
  stream?: boolean;
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ToolCallInfo {
  approved: boolean;
  tool_call_id: string;
  thread_id: string;
  title: string;
  request: string;
}

export interface ChatOptions {
  modelInfo?: ProviderOption;
  isSummary?: boolean;
  messages?: RequestMessage[];
  config: LLMConfig;
  onToolCall?: (toolCallInfo: ToolCallInfo) => void;
  toolCallInfo?: ToolCallInfo;
  onUpdate?: (
    message: string,
    mcpInfo?: { title: string; request: string; response: string },
  ) => void;
  onFinish: (
    message: string,
    response: Response,
    mcpInfo?: { title: string; request: string; response: string },
  ) => void;
  onError?: (err: Error, shouldStream: boolean) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract toolCall(options: ChatOptions): Promise<void>;
}

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}

  share() {}
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getClientApi(): ClientApi {
  return new ClientApi();
}
