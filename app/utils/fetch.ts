import { fetch } from "@tauri-apps/plugin-http";
import { useSettingStore } from "../store/setting";
import { useAuthStore } from "../store/auth";
import { getLocalToken } from "../services";
import { t } from "i18next";
import { useAppConfig } from "../store";
import { getOSInfo } from "../utils";
import { getLang } from "../locales";

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
  agent?: boolean;
};

let osString = "";

// aiden - header add Aiden-
export const getHeaders = async ({
  aiden = false,
  ignoreHeaders = false,
}: HeadersProps) => {
  let headers: Record<string, string> = {};
  const lang = getLang();
  if (!osString) {
    osString = await getOSInfo();
  }

  const token = useAuthStore.getState().userToken;
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
    headers[
      `${aiden ? "Aiden-" : ""}Authorization`
    ] = `Bearer ${token.accessToken}`;
  } else {
    console.log("[Request] no access token");
  }
  if (aiden) {
    headers["Aiden-User-Lang"] = lang;
    headers["Aiden-User-Os"] = osString;
    const localToken = useAppConfig.getState().localToken;

    headers["Host-Authorization"] = localToken;
  }
  return headers;
};

export async function aidenFetch(
  url: string,
  options: FetchBody,
): Promise<{ data: any }> {
  let res: Response;
  const domain = await getBaseDomain();
  console.log("[request] current domain: ", domain);
  const headers = await getHeaders({});
  let finnalUrl = url;
  if (url.startsWith("/")) {
    finnalUrl = `${domain}${url}`;
  }
  console.log("[Request] fetching", finnalUrl);
  try {
    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    // Only add body for non-GET requests
    if (options.method !== "GET" && options.body) {
      fetchOptions.body = JSON.stringify(options.body.payload);
    }

    res = await fetch(finnalUrl, fetchOptions);

    // Parse JSON response
    const data = await res.json();
    return { data };
  } catch (err: any) {
    console.log("[Request] fetch error occured.", err);
    const errorMessage =
      typeof err === "string" ? err : err?.message || String(err);
    if (errorMessage.includes("Network Error")) {
      throw t("error.netErr");
    }
    throw err;
  }
}
