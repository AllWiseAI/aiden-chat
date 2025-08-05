import { Body } from "@tauri-apps/api/http";
import { getLocalBaseDomain } from "@/app/utils/fetch";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";
import { getHeaders } from "@/app/utils/fetch";

const CREDENTIAL_API_PREFIX = "/credential";

// 获取 baseURL 和 headers
async function getCredentialFetchOptions() {
  const baseURL = getLocalBaseDomain();
  const headers = await getHeaders({ aiden: true });
  return { baseURL, headers };
}

// 1. 发起 OAuth 添加凭证
export async function addOAuthCredential(server_name: string) {
  const { baseURL, headers } = await getCredentialFetchOptions();
  const res = await fetchNoProxy(
    `${baseURL}${CREDENTIAL_API_PREFIX}/add/oauth`,
    {
      method: "POST",
      headers,
      body: Body.json({ server_name }),
    },
  );
  return res.json(); // { message, data: { accounts } } 或 400 报错
}

// 2. 直接添加账号密码凭证
export async function addPasswordCredential(params: {
  server_name: string;
  service: string;
  account: string;
  password: string;
}) {
  const { baseURL, headers } = await getCredentialFetchOptions();
  const res = await fetchNoProxy(
    `${baseURL}${CREDENTIAL_API_PREFIX}/add/password`,
    {
      method: "POST",
      headers,
      body: Body.json(params),
    },
  );
  return res.json(); // { message, data: { accounts } }
}

// 3. 查询指定 MCP Server 的凭证列表
export async function queryCredentials(server_name: string) {
  const { baseURL, headers } = await getCredentialFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${CREDENTIAL_API_PREFIX}/query`, {
    method: "POST",
    headers,
    body: Body.json({ server_name }),
  });
  return res.json(); // { message, data: { accounts } }
}

// 4. 移除指定凭证
export async function revokeCredential(params: {
  server_name: string;
  service: string;
  account: string;
}) {
  const { baseURL, headers } = await getCredentialFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${CREDENTIAL_API_PREFIX}/revoke`, {
    method: "POST",
    headers,
    body: Body.json(params),
  });
  return res.json(); // { message: "Credential revoked" }
}
