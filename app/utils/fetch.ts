import { fetch, Response } from "@tauri-apps/api/http";
import { useSettingStore } from "../store/setting";
import { useAuthStore } from "../store/auth";
import { isRefreshRequest } from "../services";
import { t } from "i18next";
export interface FetchBody {
  method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS";
  body?: {
    type: string;
    payload: object;
  };
}

export const getBaseDomain = async () => {
  const region = await useSettingStore.getState().getRegion();
  if (region === "CN") {
    return process.env.NODE_ENV === "development"
      ? "https://dev.aidenai.io"
      : "https://prod.aidenai.info";
  }
  return process.env.NODE_ENV === "development"
    ? "https://dev.aidenai.io"
    : "https://prod.aidenai.io";
};

const getCommonHeaders = () => {
  const device_id = useSettingStore.getState().getDeviceId();
  const accessToken = useAuthStore.getState().userToken.accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (device_id) {
    headers["X-Device-ID"] = device_id;
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
};

export async function aidenFetch<T = unknown>(
  url: string,
  options: FetchBody & { _isRefreshToken?: boolean },
): Promise<Response<T>> {
  let res: Response<T>;
  const domain = await getBaseDomain();
  let finnalUrl = url;
  if (url.startsWith("/")) {
    finnalUrl = `${domain}${url}`;
  }
  console.log("[Request] fetching", domain, finnalUrl);
  try {
    res = await fetch<T>(finnalUrl, {
      method: options.method,
      headers: { ...getCommonHeaders() },
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
      const retryRes = await aidenFetch<T>(url, options);
      return retryRes;
    } catch (err) {
      console.error("Token refresh failed", err);
      throw err;
    }
  }
  return res;
}
