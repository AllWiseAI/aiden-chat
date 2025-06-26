import { Body } from "@tauri-apps/api/http";
import { aidenFetch as fetch } from "@/app/utils/fetch";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";
import { getHeaders } from "@/app/client/api";

const baseURL = "http://127.0.0.1:6888";
const remoteMcpURL = "https://prod-hk.aidenai.io/api/config/mcp";

export async function getRemoteMcpItems() {
  const result = await fetch(remoteMcpURL, {
    method: "GET",
  });
  return result.data;
}

export async function updateMcpConfig(configJson: object) {
  const result = await fetchNoProxy(`${baseURL}/config/update`, {
    method: "POST",
    headers: await getHeaders(),
    body: Body.json(configJson),
  });
  if (result.status !== 200) {
    throw new Error("update failed: " + result.statusText);
  } else {
    const jsonResult = await result.json();
    return jsonResult;
  }
}

export async function searchMcpServerStatus(name: string) {
  const url = `${baseURL}/mcp_servers/status/${name}`;

  const result = await fetchNoProxy(url, {
    method: "GET",
    headers: await getHeaders(),
  });
  if (result.status !== 200) {
    throw new Error("search status failed: " + result.statusText);
  }

  const jsonResult = await result.json();
  console.log("[Mcp tools] searchMcpServerStatus", name, jsonResult);
  return jsonResult;
}
