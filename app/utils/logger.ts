import { invoke } from "@tauri-apps/api/tauri";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

interface ExtendedConsole extends Console {
  // @ts-expect-error
  [key: string]: (...args: any[]) => void;
}

const originalConsole: ExtendedConsole = Object.create(console);

let isLogging = false;

function formatArg(arg: any): string {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack || ""}`;
  }
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return "[Unserializable Object]";
    }
  }
  return String(arg);
}

const sendLogToBackend = (level: LogLevel, ...args: any[]): void => {
  if (isLogging) return;

  isLogging = true;
  try {
    const message = args.map(formatArg).join(" ");

    if (typeof window !== "undefined" && window.__TAURI__) {
      invoke("log_from_frontend", { level, message }).catch((err: unknown) => {
        if (typeof process !== "undefined" && process.stderr) {
          process.stderr.write(
            `Failed to send log to backend: ${String(err)}\n`,
          );
        } else {
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
