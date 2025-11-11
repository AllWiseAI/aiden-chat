// using tauri command to send request
// see src-tauri/src/stream.rs, and src-tauri/src/main.rs
// 1. invoke('stream_fetch', {url, method, headers, body}), get response with headers.
// 2. listen event: `stream-response` multi times to get body
import { fetchNoProxy as tauriFetch } from "./fetch-no-proxy";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

type ResponseEvent = {
  id: number;
  payload: {
    request_id: number;
    status?: number;
    chunk?: number[];
  };
};

type StreamResponse = {
  request_id: number;
  status: number;
  status_text: string;
  headers: Record<string, string>;
};

export function fetch(url: string, options?: RequestInit): Promise<Response> {
  if (window.__TAURI__) {
    const {
      signal,
      method = "GET",
      headers: _headers = {},
      body = [],
    } = options || {};
    let unlisten: Function | undefined;
    let setRequestId: Function | undefined;
    const requestIdPromise = new Promise((resolve) => (setRequestId = resolve));
    const ts = new TransformStream();
    const writer = ts.writable.getWriter();

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      unlisten?.();
      writer.ready.then(() => {
        writer.close().catch((e) => console.error(e));
      });
    };

    if (signal) {
      signal.addEventListener("abort", () => close());
    }
    // listen response multi times, and write to Response.body
    listen<ResponseEvent["payload"]>("stream-response", (e) =>
      requestIdPromise.then((request_id) => {
        const { request_id: rid, chunk, status } = e?.payload || {};
        if (request_id != rid) {
          return;
        }
        if (chunk) {
          writer.ready.then(() => {
            writer.write(new Uint8Array(chunk));
          });
        } else if (status === 0) {
          // end of body
          close();
        }
      }),
    ).then((u) => (unlisten = u));

    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "User-Agent": navigator.userAgent,
    };
    for (const item of new Headers(_headers || {})) {
      headers[item[0]] = item[1];
    }
    return invoke<StreamResponse>("stream_fetch", {
      method: method.toUpperCase(),
      url,
      headers,
      // TODO FormData
      body:
        typeof body === "string"
          ? Array.from(new TextEncoder().encode(body))
          : [],
    })
      .then((res) => {
        const { request_id, status, status_text: statusText, headers } = res;
        setRequestId?.(request_id);
        const response = new Response(ts.readable, {
          status,
          statusText,
          headers,
        });
        if (status >= 300) {
          setTimeout(close, 100);
        }
        return response;
      })
      .catch((e) => {
        console.error("stream error", e);
        // throw e;
        return new Response("", { status: 599 });
      });
  }
  return window.fetch(url, options);
}

/**
 * fetch with signal, use tauri-fetch， support cancel request
 * @param url
 * @param options
 * @param signal
 * @returns
 */
export async function tauriFetchWithSignal<T = any>(
  url: string,
  options: FetchOptions,
  signal?: {
    reason: any;
    aborted: boolean;
    addEventListener: (event: "abort", cb: () => void) => void;
  },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let aborted = false;

    if (signal?.aborted) {
      return reject({ isCanceled: true, message: "Request was canceled" });
    }

    const abortHandler = () => {
      aborted = true;
      reject({
        isCanceled: true,
        message: `Request was canceled, the reason is ${signal?.reason}`,
      });
    };

    signal?.addEventListener("abort", abortHandler);

    tauriFetch(url, options)
      .then((response) => {
        if (aborted) return;
        // @ts-expect-error
        resolve(response);
      })
      .catch((error) => {
        if (aborted) return;
        reject(error);
      });
  });
}
