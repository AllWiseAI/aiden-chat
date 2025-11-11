import { aidenFetch as fetch, getLocalBaseDomain } from "@/app/utils/fetch";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";
import { getHeaders } from "@/app/utils/fetch";

const remoteMcpURL = "/api/config/mcp";
const remoteAgentURL = "/api/agent_prompt";
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
    body: { payload: configJson },
  });
  if (result.status !== 200) {
    throw new Error("update failed: " + result.statusText);
  } else {
    const jsonResult = await result.json();
    return jsonResult;
  }
}

export async function getMcpStatuses(serverNames: string[]) {
  const baseURL = getLocalBaseDomain();
  const headers = await getHeaders({ aiden: true });

  const requestBody = { payload: { server_names: serverNames } };

  const result = await fetchNoProxy(`${baseURL}/mcp_servers/get_statuses`, {
    method: "POST",
    headers: headers,
    body: requestBody,
  });

  if (result.status !== 200) {
    let errorDetail = result.statusText;
    try {
      const errorBody = await result.text();
      errorDetail = errorBody || result.statusText;
    } catch (e) {
      console.error("[getMcpStatuses] Could not read error body:", e);
    }
    throw new Error("get statuses failed: " + errorDetail);
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

export async function getRagEnabled() {
  const baseURL = getLocalBaseDomain();
  const url = `${baseURL}/rag/config`;
  const headers = await getHeaders({ aiden: true });

  const result = await fetchNoProxy(url, {
    method: "GET",
    headers: headers,
  });
  if (result.status !== 200) {
    throw new Error("get rag status failed: " + result.statusText);
  } else {
    const jsonResult = await result.json();
    return jsonResult;
  }
}

export async function updateRagEnabled(status: boolean) {
  const baseURL = getLocalBaseDomain();
  const headers = await getHeaders({ aiden: true });

  const result = await fetchNoProxy(`${baseURL}/rag/config`, {
    method: "POST",
    headers: headers,
    body: { payload: { mcp_rag_enabled: status } },
  });
  console.log(result);
  if (result.status !== 200) {
    throw new Error("get statuses failed: " + result.statusText);
  } else {
    const jsonResult = await result.json();
    return jsonResult;
  }
}

export async function updateAgentConfig() {
  const baseURL = getLocalBaseDomain();

  const headers = await getHeaders({ aiden: true });
  const result = await fetchNoProxy(`${baseURL}/agent-config/notify-changed`, {
    method: "POST",
    headers: headers,
  });
  if (result.status !== 200) {
    throw new Error("update failed: " + result.statusText);
  } else {
    const jsonResult = await result.json();
    return jsonResult;
  }
}

export async function getRemoteAgentItems() {
  const result = await fetch(remoteAgentURL, {
    method: "GET",
  });
  return result.data;
}
