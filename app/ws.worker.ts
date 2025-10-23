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
let accessToken = "";

const maxRetries = 5;

const reconnectInterval = 3000;
const pingInterval = 10000;
const pongTimeout = 3000;

let pingTimer: ReturnType<typeof setInterval> | null = null;
let pongTimer: ReturnType<typeof setTimeout> | null = null;

const baseUrl = "ws://localhost";

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

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as TaskMessage | { type: string };

      if (data.type === "pong") {
        resetPongTimeout();
        return;
      }
      console.log("[Worker][WebSocket] Received message:", data.type);

      switch (data.type) {
        case "get_latest_refresh_token":
          send({
            type: "update_refresh_token",
            token: accessToken,
          });
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
    console.error("[Worker][WebSocket] Error:", JSON.stringify(err));
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
      accessToken = payload.accessToken;
      connect();
      break;

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
