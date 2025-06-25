import { invoke } from "@tauri-apps/api/tauri";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

interface ExtendedConsole extends Console {
  // @ts-expect-error
  [key: string]: (...args: any[]) => void;
}

const originalConsole: ExtendedConsole = Object.create(console);

let isLogging = false;

const sendLogToBackend = (level: LogLevel, ...args: any[]): void => {
  // 防止循环调用
  if (isLogging) {
    // originalConsole.warn('Detected potential logging loop, skipping:', args);
    return;
  }

  isLogging = true;
  try {
    const message: string = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(" ");

    // 仅在 Tauri 环境中调用 invoke
    if (typeof window !== "undefined" && window.__TAURI__) {
      invoke("log_from_frontend", { level, message }).catch((err: unknown) => {
        // 避免使用 console.error，直接打印到原始 stderr
        // 使用 process.stderr.write 代替 console.error
        if (typeof process !== "undefined" && process.stderr) {
          process.stderr.write(
            `Failed to send log to backend: ${String(err)}\n`,
          );
        } else {
          // 备用方案：使用原始 console.error
          originalConsole.error("Failed to send log to backend:", err);
        }
      });
    } else {
      originalConsole[level](...args);
    }

    // 始终调用原始 console 方法
    originalConsole[level](...args);
  } finally {
    isLogging = false;
  }
};

console.log = (...args: any[]) => sendLogToBackend("info", ...args);
console.info = (...args: any[]) => sendLogToBackend("info", ...args);
console.warn = (...args: any[]) => sendLogToBackend("warn", ...args);
console.error = (...args: any[]) => sendLogToBackend("error", ...args);
console.debug = (...args: any[]) => sendLogToBackend("debug", ...args);
console.trace = (...args: any[]) => sendLogToBackend("trace", ...args);

let isInitialized = false;

export default function initLogger(): void {
  if (isInitialized) {
    originalConsole.warn("Logger already initialized, skipping.");
    return;
  }
  isInitialized = true;

  originalConsole.info("Logger initialized for Tauri backend");
}
