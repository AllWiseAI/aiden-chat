"use client";
import { REQUEST_TIMEOUT_MS } from "@/app/constant";
import { ModelSize, DalleQuality, DalleStyle } from "@/app/typing";
import { ChatOptions, LLMApi, MultimodalContent } from "../api";
import {
  getBaseChatUrl,
  getHeaders,
  getSecondChatUrl,
} from "@/app/utils/fetch";
import { tauriFetchWithSignal } from "@/app/utils/stream";
import { streamWithThink, parseSSE } from "@/app/utils/chat";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export interface RequestPayload {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  top_p?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
}

export interface DalleRequestPayload {
  model: string;
  prompt: string;
  response_format: "url" | "b64_json";
  n: number;
  size: ModelSize;
  quality: DalleQuality;
  style: DalleStyle;
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  async extractMessage(res: any) {
    if (res.status !== 200) {
      // return "```\n" + JSON.stringify(res, null, 4) + "\n```";
      return "服务器错误，请稍后再试！";
    }
    return res.data?.message?.content;
  }

  async chat(options: ChatOptions) {
    const DEFAULT_CHAT_URL = getBaseChatUrl();
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages || []) {
      messages.push({ role: v.role, content: v.content });
    }
    const requestPayload: RequestPayload = { messages };
    const shouldStream = !!options.config.stream;

    const controller = new AbortController();
    options.onController?.(controller);
    const isSummary = options.isSummary ?? false;
    const headers = await getHeaders({ aiden: true, isSummary });
    try {
      if (shouldStream) {
        streamWithThink(
          DEFAULT_CHAT_URL,
          requestPayload,
          headers,
          controller,
          parseSSE,
          options,
        );
      } else {
        const requestTimeoutId = setTimeout(
          () => controller.abort("timeout"),
          REQUEST_TIMEOUT_MS,
        );
        const res = await tauriFetchWithSignal(
          DEFAULT_CHAT_URL,
          {
            method: "POST",
            body: {
              type: "Json",
              payload: {
                messages: requestPayload.messages,
              },
            },
            headers,
          },
          controller.signal,
        );

        clearTimeout(requestTimeoutId);
        const resJson = await res.json();
        const message = resJson?.message?.content;
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error, shouldStream);
    }
  }

  async toolCall(options: ChatOptions) {
    const SECOND_CHAT_URL = getSecondChatUrl();
    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    const requestPayload = {
      ...options.toolCallInfo,
    };
    const headers = await getHeaders({ aiden: true });
    try {
      if (shouldStream) {
        streamWithThink(
          SECOND_CHAT_URL,
          requestPayload,
          headers,
          controller,
          parseSSE,
          options,
        );
      } else {
        const requestTimeoutId = setTimeout(
          () => controller.abort("timeout"),
          REQUEST_TIMEOUT_MS,
        );

        const res = await tauriFetchWithSignal(
          SECOND_CHAT_URL,
          {
            method: "POST",
            body: {
              type: "Json",
              payload: {
                ...options.toolCallInfo,
              },
            },
          },
          controller.signal,
        );

        clearTimeout(requestTimeoutId);
        const resJson = await res.json();
        const message = resJson?.message?.content;
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error, shouldStream);
    }
  }
}
