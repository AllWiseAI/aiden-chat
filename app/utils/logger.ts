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

function getFormattedTime(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss},${ms}`;
}

const sendLogToBackend = (level: LogLevel, ...args: any[]): void => {
  if (isLogging) return;

  isLogging = true;
  try {
    const timestamp = getFormattedTime();
    const message = args.map(formatArg).join(" ");
    const formattedMessage = `${timestamp} - ${level.toUpperCase()} ${message}`;

    if (typeof window !== "undefined" && window.__TAURI__) {
      invoke("log_from_frontend", { level, message: formattedMessage }).catch(
        (err: unknown) => {
          if (typeof process !== "undefined" && process.stderr) {
            process.stderr.write(
              `Failed to send log to backend: ${String(err)}\n`,
            );
          } else {
            originalConsole.error("Failed to send log to backend:", err);
          }
        },
      );
    } else {
      originalConsole[level](formattedMessage);
    }

    // 始终调用原始 console 方法
    originalConsole[level](formattedMessage);
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
