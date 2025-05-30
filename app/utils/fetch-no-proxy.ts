interface FetchNoProxyOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface FetchNoProxyResponse {
  status: number;
  statusText: string;
  body: string;
  headers?: Record<string, string>;
}

export async function fetchNoProxy(
  url: string,
  options: FetchNoProxyOptions = {},
) {
  const { method = "GET", headers = {}, body } = options;
  const { invoke } = await import("@tauri-apps/api");
  const response = await invoke<FetchNoProxyResponse>("fetch_no_proxy", {
    options: {
      url,
      method,
      headers,
      body: JSON.stringify(body?.payload),
    },
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    text: async () => response.body,
    json: async () => {
      try {
        return JSON.parse(response.body);
      } catch (e) {
        throw new Error("Failed to parse JSON");
      }
    },
  };
}
