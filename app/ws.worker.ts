import { showNotification } from "./utils/notification";

const titleMap = {
  task_completed: "Task Completed",
  task_failed: "Task Failed",
  task_tested: "Task Tested",
  get_latest_refresh_token: "Get Latest Refresh Token",
  analytics_event: "Analytics Event",
};

export type TaskEventType =
  | "task_completed"
  | "task_tested"
  | "task_failed"
  | "ping"
  | "pong";

export type TaskBase = {
  type: TaskEventType;
  task_id: string;
  task_description: string;
  timestamp: string;
  request_messages: string;
  original_info: string;
};

export type TaskCompletedOrTested = TaskBase & {
  type: "task_completed" | "task_tested";
  response_data: string;
  task_description: string;
};

export type TaskFailed = TaskBase & {
  type: "task_failed";
  error_msg: string;
  error_type: string;
  exception_type: string;
  task_description: string;
};

export type TaskRefreshToken = {
  type: "get_latest_refresh_token";
  task_description: string;
};

export type AnalyticsEvent = {
  type: "analytics_event";
  event_name: string;
  params: Record<string, string>;
};

export type TaskMessage =
  | TaskCompletedOrTested
  | TaskFailed
  | TaskRefreshToken
  | AnalyticsEvent;

interface TokenType {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

function setupWorkerLogger() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  function sendLog(type: "log" | "warn" | "error", ...args: any[]) {
    postMessage({
      type: "worker_log",
      payload: args.map(String).join(" "),
    });
  }

  console.log = (...args: any[]) => {
    sendLog("log", ...args);
    originalConsole.log(...args);
  };

  console.warn = (...args: any[]) => {
    sendLog("warn", ...args);
    originalConsole.warn(...args);
  };

  console.error = (...args: any[]) => {
    sendLog("error", ...args);
    originalConsole.error(...args);
  };
}

setupWorkerLogger();

let socket: WebSocket | null = null;
let port = 0;
let localToken = "";
let retryCount = 0;
let userToken = {} as TokenType;
let baseDomain = "https://prod.aidenai.io";

async function refreshAccessToken(baseDomain: string, refreshToken: string) {
  try {
    const response = await fetch(`${baseDomain}/auth/refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) {
      console.error("[refreshAccessToken] Failed:", response.status);
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    console.log("[refreshAccessToken] Success:", data);
    return data;
  } catch (err) {
    console.error("[refreshAccessToken] Error:", err);
    throw err;
  }
}

const maxRetries = 5;

const reconnectInterval = 3000;
const pingInterval = 10000;
const pongTimeout = 3000;
const FIVE_MINUTES = 5 * 60 * 1000;

let pingTimer: ReturnType<typeof setInterval> | null = null;
let pongTimer: ReturnType<typeof setTimeout> | null = null;

const baseUrl = "ws://localhost";
let refreshingPromise: Promise<void> | null = null;

async function resolveLatestRefreshToken() {
  try {
    const { refreshToken, expires } = userToken;
    const needRefresh = expires * 1000 - Date.now() <= FIVE_MINUTES;

    if (needRefresh) {
      if (refreshingPromise) {
        console.log("[Worker] Waiting for ongoing token refresh...");
        await refreshingPromise;
      } else {
        refreshingPromise = (async () => {
          const newToken = await refreshAccessToken(baseDomain, refreshToken);
          console.log("[Worker] Token refresh successful:", newToken);

          const { access_token, refresh_token, expires_at } = newToken;
          userToken = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expires: expires_at,
          };
          send({
            type: "get_latest_refresh_token",
            token: access_token,
          });
          refreshingPromise = null;
        })();

        await refreshingPromise;
      }
    } else {
      console.log("[Worker] Token not expired, no refresh needed.");
      send({
        type: "get_latest_refresh_token",
        token: userToken.accessToken,
      });
    }
  } catch (e) {
    console.log("[Worker][WebSocket] get_latest_refresh_token error: ", e);
  }
}

function connect() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  if (retryCount >= maxRetries) {
    postMessage({ type: "error", message: "Max retries reached" });
    return;
  }

  const url = `${baseUrl}:${port}/ws?token=${localToken}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    retryCount = 0;
    startPing();
    postMessage({ type: "status", message: "connected" });
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data) as TaskMessage | { type: string };
      console.log("[Worker][WebSocket] Received message:", data.type);
      if (data.type === "pong") {
        resetPongTimeout();
        return;
      }

      switch (data.type) {
        case "get_latest_refresh_token":
          resolveLatestRefreshToken();
          break;

        case "task_completed":
        case "task_failed":
        case "task_tested":
          showNotification({
            title: titleMap[data.type] ?? data.type,
            body: (data as TaskCompletedOrTested | TaskFailed).task_description,
          });
          break;

        case "analytics_event":
          // 不要求时效性，交给主线程去处理
          postMessage({ type: "analytics_event", payload: data });
          break;

        default:
          console.warn("[Worker][WebSocket] Unknown message:", data);
      }
    } catch (err) {
      console.error("[Worker][WebSocket] Parse error:", err);
    }
  };

  socket.onclose = () => {
    stopPing();
    retryCount++;
    setTimeout(connect, reconnectInterval);
  };

  socket.onerror = (err) => {
    console.error("[Worker][WebSocket] Error:", err);
    socket?.close();
  };
}

function startPing() {
  stopPing();
  pingTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      send({ type: "ping" });
      pongTimer = setTimeout(() => {
        socket?.close();
      }, pongTimeout);
    }
  }, pingInterval);
}

function resetPongTimeout() {
  if (pongTimer) {
    clearTimeout(pongTimer);
    pongTimer = null;
  }
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  resetPongTimeout();
}

function send(data: string | object) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  socket.send(payload);
}

onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  switch (type) {
    case "connect":
      port = payload.port;
      localToken = payload.localToken;
      userToken = payload.userToken;
      baseDomain = payload.baseDomain;
      connect();
      break;

    // case "resolve_latest_refresh_token":
    //   resolveLatestRefreshToken();
    //   break;

    case "send":
      send(payload);
      break;

    case "disconnect":
      stopPing();
      socket?.close();
      socket = null;
      break;
  }
};
