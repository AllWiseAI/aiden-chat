export const EVENTS = {
  // 首页
  HOME_EXPOSURE: "home_exposure", // 首页曝光UV

  // Task 页面
  TASK_PAGE_EXPOSURE: "task_page_exposure", // Task 页面曝光UV

  // New Chat
  NEW_CHAT_CLICK: "new_chat_click", // New Chat 按钮点击

  // New Task
  NEW_TASK_CLICK: "new_task_click", // New Task 按钮点击

  // MCP
  MCP_BUTTON_CLICK: "mcp_button_click", // MCP 按钮点击
  MCP_STORE_OPEN: "mcp_store_open", // MCP 开启数

  // 设置页面
  SETTING_GENERAL_EXPOSURE: "setting_general_exposure",
  SETTING_MODEL_EXPOSURE: "setting_model_exposure",
  SETTING_MCP_EXPOSURE: "setting_mcp_exposure",
  SETTING_ABOUT_EXPOSURE: "setting_about_exposure",

  // 搜索
  SEARCH_BUTTON_CLICK: "search_button_click",
} as const;
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type TrackEvent = {
  event: EventName;
  payload: Record<string, any>;
  timestamp: number;
  appVersion: string;
};

const STORAGE_KEY = "analysis_events";
const FLUSH_INTERVAL = 10_000; // 10 秒批量上报一次
const API_ENDPOINT = "/api/track"; // 后端接口

function loadEvents(): TrackEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: TrackEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function track(event: EventName, payload: Record<string, any> = {}) {
  const newEvent: TrackEvent = {
    event,
    payload,
    timestamp: Date.now(),
    appVersion: "1.0.0",
  };
  if (process.env.NODE_ENV !== "production") {
    console.log("[track:dev]", newEvent);
    return;
  }

  const events = loadEvents();
  events.push(newEvent);
  saveEvents(events);
}

async function flush() {
  const events = loadEvents();
  if (events.length === 0) return;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    });

    if (res.ok) {
      console.log(`[analysis] 成功上报 ${events.length} 条事件`);
      saveEvents([]);
    } else {
      console.warn(`[analysis] 上报失败: ${res.statusText}`);
    }
  } catch (err) {
    console.error("[analysis] 上报异常:", err);
  }
}

setInterval(flush, FLUSH_INTERVAL);

window.addEventListener("beforeunload", flush);
