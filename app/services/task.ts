import { Body } from "@tauri-apps/api/http";
import { getLocalBaseDomain } from "@/app/utils/fetch";
import { fetchNoProxy } from "@/app/utils/fetch-no-proxy";
import { getHeaders } from "@/app/utils/fetch";
import { TaskPayload, ChatModelInfo } from "@/app/typing";
import { getChatHeaders } from "../utils/chat";

const TASK_API_PREFIX = "/scheduler";

async function getLocalFetchOptions() {
  const baseURL = getLocalBaseDomain();
  const headers = await getHeaders({ aiden: true });
  return { baseURL, headers };
}

// 测试任务
export async function testTask(task: object) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${TASK_API_PREFIX}/test_task`, {
    method: "POST",
    headers,
    body: Body.json(task),
  });
  return res.json();
}

// 创建任务
export async function createTask(task: TaskPayload) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${TASK_API_PREFIX}/add_task`, {
    method: "POST",
    headers,
    body: Body.json(task),
  });
  return res.json();
}

// 更新任务
export async function updateTask(task: TaskPayload) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${TASK_API_PREFIX}/update_task`, {
    method: "PUT",
    headers,
    body: Body.json(task),
  });
  return res.json();
}

// 删除任务
export async function deleteTask(task_id: string) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${TASK_API_PREFIX}/remove_task`, {
    method: "DELETE",
    headers,
    body: Body.json({ task_id }),
  });
  return res.json();
}

// 获取任务详情
export async function getTaskDetail(task_id: string) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(
    `${baseURL}${TASK_API_PREFIX}/task/${task_id}`,
    {
      method: "GET",
      headers,
    },
  );
  return res.json();
}

// 获取任务列表
export async function getTaskList() {
  const { baseURL, headers } = await getLocalFetchOptions();
  const res = await fetchNoProxy(`${baseURL}${TASK_API_PREFIX}/tasks`, {
    method: "GET",
    headers,
  });
  return res.json();
}

// 获取任务执行记录
export async function getTaskExecutionRecords(
  task_id: string,
  page_num = 1,
  page_size = 10,
) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const url = `${baseURL}${TASK_API_PREFIX}/task_execution_records?task_id=${task_id}&page_num=${page_num}&page_size=${page_size}`;
  const res = await fetchNoProxy(url, {
    method: "GET",
    headers,
  });
  return res.json();
}

// 切换任务模型
export async function switchTaskModel(
  task_id: string,
  modelInfo: ChatModelInfo,
) {
  const { baseURL, headers } = await getLocalFetchOptions();
  const chatHeaders = getChatHeaders(modelInfo);

  const res = await fetchNoProxy(
    `${baseURL}${TASK_API_PREFIX}/switch_task_model`,
    {
      method: "POST",
      // @ts-ignore
      headers: {
        ...chatHeaders,
        "Host-Authorization": headers["Host-Authorization"],
      },
      body: Body.json({ task_id }),
    },
  );
  return res.json();
}
