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

type MessageCallback = (msg: TaskMessage) => void;
class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: MessageCallback[] = [];
  private reconnectInterval = 3000;
  private baseUrl = "ws://localhost";
  private port: number = 6888;
  private retryCount = 0;
  private localToken: string = "";
  private readonly maxRetries = 5;

  private pingInterval = 10000;
  private pongTimeout = 3000;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  connect(port: number, localToken: string) {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.retryCount >= this.maxRetries) {
      console.error("[WebSocket] Max retries reached. Giving up.");
      return;
    }

    this.port = port;
    this.localToken = localToken;
    const url = `${this.baseUrl}:${this.port}/ws?token=${this.localToken}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("[WebSocket] Connected to server.");
      this.startPing();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TaskMessage | { type: string };

        if (data.type === "pong") {
          console.log("[WebSocket][Heartbeat] Received pong.");
          this.resetPongTimeout();
          return;
        }

        if (
          [
            "task_completed",
            "task_tested",
            "task_failed",
            "get_latest_refresh_token",
            "analytics_event",
            "ping",
          ].includes(data.type)
        ) {
          this.listeners.forEach((cb) => cb(data as TaskMessage));
        } else {
          console.warn("[WebSocket] Unknown message type:", data);
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err, event.data);
      }
    };

    this.socket.onclose = () => {
      this.stopPing();
      this.retryCount++;
      console.warn("[WebSocket] Connection closed. Reconnecting in 3s...");
      setTimeout(
        () => this.connect(this.port, this.localToken),
        this.reconnectInterval,
      );
    };

    this.socket.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
      this.socket?.close();
    };
  }

  private startPing() {
    this.stopPing();
    console.log("[WebSocket][Heartbeat] Starting ping interval.");

    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        console.log("[WebSocket][Heartbeat] Sending ping...");
        this.send({ type: "ping" });
        this.pongTimer = setTimeout(() => {
          console.warn(
            "[WebSocket] Pong not received. Closing socket to reconnect.",
          );
          this.socket?.close();
        }, this.pongTimeout);
      }
    }, this.pingInterval);
  }

  private resetPongTimeout() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
      console.log("[WebSocket][Heartbeat] Pong timeout cleared.");
    }
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
      console.log("[WebSocket][Heartbeat] Ping interval stopped.");
    }
    this.resetPongTimeout();
  }

  onMessage(cb: MessageCallback) {
    if (!this.listeners.includes(cb)) {
      this.listeners.push(cb);
    }
  }

  clearListeners() {
    this.listeners = [];
  }

  send(data: string | object) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Cannot send message: socket is not open.");
      return;
    }
    try {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      this.socket.send(payload);
      console.log("[WebSocket][Heartbeat] Ping sent.");
    } catch (err) {
      console.error("[WebSocket] Failed to send message:", err);
    }
  }

  disconnect() {
    this.stopPing();
    if (this.socket) {
      console.log("[WebSocket] Disconnecting manually.");
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketManager = new WebSocketManager();
