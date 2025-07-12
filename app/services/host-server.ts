import { Body } from "@tauri-apps/api/http";
import { aidenFetch as fetch, getLocalBaseDomain } from "@/app/utils/fetch";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";
import { getHeaders } from "@/app/utils/fetch";

const remoteMcpURL = "/api/config/mcp";
const localTokenURL = "/authorization/token";

export async function getLocalToken() {
  const baseURL = getLocalBaseDomain();
  const headers = await getHeaders({ aiden: true });
  const result = await fetchNoProxy(`${baseURL}${localTokenURL}`, {
    method: "GET",
    headers: headers,
  });

  if (result.status !== 200) {
    throw new Error("search status failed: " + result.statusText);
  }

  const jsonResult = await result.json();
  return jsonResult;
}

export async function getRemoteMcpItems() {
  const result = await fetch(remoteMcpURL, {
    method: "GET",
  });
  return result.data;
}

export async function updateMcpConfig(configJson: object) {
  const baseURL = getLocalBaseDomain();

  const headers = await getHeaders({ aiden: true });
  const result = await fetchNoProxy(`${baseURL}/config/update`, {
    method: "POST",
    headers: headers,
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
  const baseURL = getLocalBaseDomain();

  const url = `${baseURL}/mcp_servers/status/${name}`;
  const headers = await getHeaders({ aiden: true });
  const result = await fetchNoProxy(url, {
    method: "GET",
    headers: headers,
  });
  if (result.status !== 200) {
    throw new Error("search status failed: " + result.statusText);
  }

  const jsonResult = await result.json();
  console.log("[Mcp tools] searchMcpServerStatus", name, jsonResult);
  return jsonResult;
}
