import config from "@/src-tauri/tauri.conf.json";
import { getOSInfo } from "@/app/utils";
import { getLang } from "@/app/locales";
import { useSettingStore } from "../store/setting";
import { aidenFetch as fetch } from "@/app/utils/fetch";

export const EVENTS = {
  HOME_EXPOSURE: "home_exposure", // 首页曝光UV
  TASK_PAGE_EXPOSURE: "task_page_exposure", // Task 页面曝光UV
  NEW_CHAT_CLICK: "new_chat_click", // New Chat 按钮点击
  CHAT_COUNT: "chat_count", // 聊天次数
  NEW_TASK_CLICK: "new_task_click", // New Task 按钮点击
  MCP_BUTTON_CLICK: "mcp_button_click", // MCP 按钮点击
  MCP_STORE_OPEN: "mcp_store_open", // MCP 开启数
  SETTING_GENERAL_EXPOSURE: "setting_general_exposure",
  SETTING_MODEL_EXPOSURE: "setting_model_exposure",
  SETTING_MCP_EXPOSURE: "setting_mcp_exposure",
  SETTING_ABOUT_EXPOSURE: "setting_about_exposure",
  SEARCH_BUTTON_CLICK: "search_button_click",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type TrackEvent = {
  event_name: EventName;
  params: Record<string, any>;
};

const STORAGE_KEY = "analysis_events";
const FLUSH_INTERVAL = 10_000;
const API_ENDPOINT = "/api/tracking";

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

let osInfo = "";
const lang = getLang();
const appVersion = config.version;

function appendEvent(newEvent: TrackEvent) {
  const events = loadEvents();
  events.push(newEvent);
  saveEvents(events);
}

export async function track(
  event: EventName,
  payload: Record<string, any> = {},
) {
  if (!osInfo) {
    osInfo = await getOSInfo();
  }
  const newEvent: TrackEvent = {
    event_name: event,
    params: {
      payload,
      timestamp: Date.now(),
      appVersion: appVersion,
      osInfo: osInfo,
      lang: lang,
      region: useSettingStore.getState().region,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("[track:dev]", event, newEvent);
    return;
  }

  appendEvent(newEvent);
}

let flushing = false;

async function flush() {
  if (flushing) return;
  flushing = true;

  const events = loadEvents();
  if (events.length === 0) {
    flushing = false;
    return;
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      body: {
        type: "Json",
        payload: events,
      },
    });
    if (res) {
      console.log(`[analysis] 成功上报 ${events.length} 条事件`);
      const current = loadEvents();
      const remaining = current.slice(events.length);
      saveEvents(remaining);
    } else {
      console.warn(`[analysis] 上报失败`);
    }
  } catch (err) {
    console.error("[analysis] 上报异常:", err);
  } finally {
    flushing = false;
  }
}

export function initAnalysis() {
  if (typeof window === "undefined") return;
  setInterval(flush, FLUSH_INTERVAL);
  window.addEventListener("beforeunload", flush);
}
