import { fetch, Body } from "@tauri-apps/api/http";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";

const baseURL = "http://localhost:6888";

const remoteMcpURL = "https://prod-hk.aidenai.io/api/config/mcp";

const getCommonHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
};

export async function getRemoteMcpItems() {
  const result = await fetch(remoteMcpURL, {
    method: "GET",
    headers: { ...getCommonHeaders() },
  });
  return result.data;
}

export async function updateMcpConfig(configJson: object) {
  const result = await fetchNoProxy(`${baseURL}/config/update`, {
    method: "POST",
    headers: { ...getCommonHeaders() },
    body: Body.json(configJson),
  });
  const jsonResult = await result.json();
  return jsonResult;
}

export async function disableMcpServers(servers: string | string[]) {
  const payload = {
    servers: Array.isArray(servers) ? servers : [servers],
  };
  const result = await fetchNoProxy(`${baseURL}/mcp_servers/disable`, {
    method: "POST",
    headers: { ...getCommonHeaders() },
    body: Body.json(payload),
  });

  const jsonResult = await result.json();
  return jsonResult;
}

export async function searchMcpServerStatus(name: string) {
  const url = `${baseURL}/mcp_servers/status/${name}`;

  const result = await fetchNoProxy(url, {
    method: "GET",
    headers: { ...getCommonHeaders() },
  });
  const jsonResult = await result.json();

  return jsonResult;
}
