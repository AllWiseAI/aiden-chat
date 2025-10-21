import { fetch, Response } from "@tauri-apps/api/http";
import { useSettingStore } from "../store/setting";
import { useAuthStore } from "../store/auth";
import { isRefreshRequest, getLocalToken } from "../services";
import { toast } from "@/app/utils/toast";
import { t } from "i18next";
import { useAgentStore, useAppConfig } from "../store";
import { ProviderOption } from "../typing";
import { getOSInfo } from "../utils";
import { getLang } from "../locales";

const FIVE_MINUTES = 5 * 60 * 1000;

export interface FetchBody {
  method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS";
  body?: {
    type: string;
    payload: object;
  };
}

export const initLocalToken = async () => {
  const config = useAppConfig.getState();
  async function getToken() {
    try {
      const token = await getLocalToken();
      const { data } = token;
      console.log("getLocalToken result", data);
      config.setLocalToken(data);
      console.log("getLocalToken success");
    } catch (error) {
      console.log("getLocalToken error", JSON.stringify(error));
    }
  }
  await getToken();
};

export const getLocalBaseDomain = () => {
  const hostServerPort = useAppConfig.getState().hostServerPort;
  return `http://127.0.0.1:${hostServerPort}`;
};

export const getBaseChatUrl = () => {
  const baseURL = getLocalBaseDomain();
  return `${baseURL}/agent/chat`;
};

export const getBaseSummaryUrl = () => {
  const baseURL = getLocalBaseDomain();
  return `${baseURL}/agent/summary`;
};

export const getSecondChatUrl = () => {
  const baseURL = getLocalBaseDomain();
  return `${baseURL}/agent/continue-tool-call`;
};

export const getBaseDomain = async () => {
  const debugMode = useAppConfig.getState().debugMode;
  const isDev = debugMode || process.env.NODE_ENV === "development";
  return isDev ? "https://dev.aidenai.io" : "https://prod.aidenai.io";
};

type HeadersProps = {
  aiden?: boolean;
  isSummary?: boolean;
  ignoreHeaders?: boolean;
  refresh?: boolean;
  agent?: boolean;
};

let osString = "";

// aiden - header add Aiden-
// refresh - should refresh token detect
export const getHeaders = async ({
  aiden = false,
  isSummary = false,
  ignoreHeaders = false,
  refresh = true,
  agent = false,
}: HeadersProps) => {
  let headers: Record<string, string> = {};
  const lang = getLang();
  if (!osString) {
    osString = await getOSInfo();
  }

  const token = useAuthStore.getState().userToken;
  const refreshToken = useAuthStore.getState().refreshToken;
  const device_id = useSettingStore.getState().getDeviceId();

  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (device_id) {
      headers["X-Device-ID"] = device_id;
    }
  }

  if (token.accessToken) {
    let latestToken = useAuthStore.getState().userToken.accessToken;

    if (refresh && token.expires * 1000 - Date.now() <= FIVE_MINUTES) {
      try {
        const token = await refreshToken();
        if (token) {
          latestToken = token;
        }
      } catch (e) {
        console.log("refresh token before:", token.refreshToken);
        console.log("[refresh token] refresh token error: ", e);
        toast.error(t("error.refreshToken"));
      } finally {
        console.log("[refresh token] refresh token done.");
      }
    }
    headers[`${aiden ? "Aiden-" : ""}Authorization`] = `Bearer ${latestToken}`;
  }
  if (aiden) {
    headers["Aiden-User-Lang"] = lang;
    headers["Aiden-User-Os"] = osString;
    const localToken = useAppConfig.getState().localToken;

    headers["Host-Authorization"] = localToken;
    if (agent) {
      const agentHeaders = useAgentStore.getState().getAgentsHeader();
      headers = { ...headers, ...agentHeaders };
    }

    if (isSummary) {
      const summaryModel = useAppConfig
        .getState()
        .getSummaryModel() as unknown as ProviderOption;
      const { model, provider, endpoint } = summaryModel;
      headers["Aiden-Text-Model"] = `${model}$${provider}$${endpoint}`;
    }
  }
  return headers;
};

export async function aidenFetch<T = unknown>(
  url: string,
  options: FetchBody & { _isRefreshToken?: boolean },
): Promise<Response<T>> {
  let res: Response<T>;
  const domain = await getBaseDomain();
  console.log("[request] current domain: ", domain);
  const headers = await getHeaders({ refresh: false });
  let finnalUrl = url;
  if (url.startsWith("/")) {
    finnalUrl = `${domain}${url}`;
  }
  console.log("[Request] fetching", finnalUrl);
  try {
    res = await fetch<T>(finnalUrl, {
      method: options.method,
      headers,
      body: options.body ? options.body : undefined,
    });
  } catch (err: any) {
    // 网络错误
    console.log("[Request] fetch error occured.", err);
    if (err.includes("Network Error")) {
      throw t("error.netErr");
    }
    throw err;
  }

  // 刷新 token 重新请求
  if (
    (res.status === 401 || (res.data as any)?.expire_at * 1000 < Date.now()) &&
    !isRefreshRequest(options)
  ) {
    try {
      await useAuthStore.getState().refreshToken();
    } catch (err) {
      console.error("Token refresh failed", err);
      throw err; // 抛错避免死循环
    }
    try {
      const retryRes = await aidenFetch<T>(url, {
        ...options,
        _isRefreshToken: true, // 标记避免循环
      });
      return retryRes;
    } catch (err) {
      throw err;
    }
  }
  return res;
}
