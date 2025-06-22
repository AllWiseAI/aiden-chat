import { fetch } from "@tauri-apps/api/http";
import { useSettingStore } from "../store/setting";
import { useAuthStore } from "../store/auth";
import { isRefreshRequest } from "../services";

export interface FetchBody {
  method: "POST" | "GET" | "PUT" | "DELETE" | "OPTIONS";
  body?: {
    type: string;
    payload: object;
  };
}

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
): Promise<ReturnType<typeof fetch<T>>> {
  console.warn("req", {
    method: options.method,
    headers: { ...getCommonHeaders() },
    body: options.body ? options.body : undefined,
  });
  const res = await fetch<T>(url, {
    method: options.method,
    headers: { ...getCommonHeaders() },
    body: options.body ? options.body : undefined,
  });

  // 刷新 token 重新请求
  if (
    (res.status === 401 || (res.data as any)?.expire_at * 1000 < Date.now()) &&
    !isRefreshRequest(options)
  ) {
    console.log("不是刷新token");
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
