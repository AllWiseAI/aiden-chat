export type TaskEventType = "task_completed" | "task_tested" | "task_failed";

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
};

export type TaskFailed = TaskBase & {
  type: "task_failed";
  error_msg: string;
  error_type: string;
  exception_type: string;
};

export type TaskRefreshToken = {
  type: "get_latest_refresh_token";
  task_description: "";
};

export type TaskMessage = TaskCompletedOrTested | TaskFailed | TaskRefreshToken;

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
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TaskMessage;
        if (
          ["task_completed", "task_tested", "task_failed"].includes(data.type)
        ) {
          this.listeners.forEach((cb) => cb(data));
        } else {
          console.warn("[WebSocket] Unknown message type:", data);
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err, event.data);
      }
    };

    this.socket.onclose = () => {
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

  onMessage(cb: MessageCallback) {
    this.listeners.push(cb);
  }

  send(data: string | object) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Cannot send message: socket is not open.");
      return;
    }
    try {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      this.socket.send(payload);
    } catch (err) {
      console.error("[WebSocket] Failed to send message:", err);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketManager = new WebSocketManager();
