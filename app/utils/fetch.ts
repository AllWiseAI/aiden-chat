import { fetch, Response } from "@tauri-apps/api/http";
import { useSettingStore } from "../store/setting";
import { useAuthStore } from "../store/auth";
import { isRefreshRequest } from "../services";
import { t } from "i18next";

const FIVE_MINUTES = 5 * 60 * 1000;
export interface FetchBody {
  method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS";
  body?: {
    type: string;
    payload: object;
  };
}

export const getBaseDomain = async () => {
  const region = await useSettingStore.getState().region;
  if (region === "CN") {
    return process.env.NODE_ENV === "development"
      ? "https://dev.aidenai.io"
      : "https://prod.aidenai.info";
  }
  return process.env.NODE_ENV === "development"
    ? "https://dev.aidenai.io"
    : "https://prod.aidenai.io";
};

// aiden - header add Aiden-
// refresh - should refresh token detect
export const getHeaders = async ({
  aiden = false,
  ignoreHeaders = false,
  refresh = true,
}) => {
  let headers: Record<string, string> = {};
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
    if (refresh && token.expires * 1000 - Date.now() <= FIVE_MINUTES) {
      await refreshToken();
    }
    const latestToken = useAuthStore.getState().userToken.accessToken;
    headers[`${aiden ? "Aiden-" : ""}Authorization`] = `Bearer ${latestToken}`;
  }
  return headers;
};

export async function aidenFetch<T = unknown>(
  url: string,
  options: FetchBody & { _isRefreshToken?: boolean },
): Promise<Response<T>> {
  let res: Response<T>;
  const domain = await getBaseDomain();
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
    }
    try {
      const retryRes = await aidenFetch<T>(url, options);
      return retryRes;
    } catch (err) {
      throw err;
    }
  }
  return res;
}
