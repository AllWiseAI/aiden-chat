use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderName};
use reqwest::Client;
use std::collections::HashMap;
use std::error::Error;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;
use tauri::Emitter;

static REQUEST_COUNTER: AtomicU32 = AtomicU32::new(0);

#[derive(Debug, Clone, serde::Serialize)]
pub struct StreamResponse {
    request_id: u32,
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
}

#[derive(Clone, serde::Serialize)]
pub struct EndPayload {
    request_id: u32,
    status: u16,
}

#[derive(Clone, serde::Serialize)]
pub struct ChunkPayload {
    request_id: u32,
    chunk: String, // ✅ 改为 String 而不是 bytes
}

#[tauri::command]
pub async fn stream_fetch(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let event_name = "stream-response";
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);

    // 构造 header
    let mut _headers = HeaderMap::new();
    for (key, value) in &headers {
        if let (Ok(name), Ok(val)) = (key.parse::<HeaderName>(), value.parse()) {
            _headers.insert(name, val);
        }
    }

    // 构造请求客户端
    let client = Client::builder()
        .default_headers(_headers)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(5, 0))
        .build()
        .map_err(|err| format!("failed to create client: {}", err))?;

    let method = method
        .parse::<reqwest::Method>()
        .map_err(|err| format!("invalid method: {}", err))?;

    let mut request = client
        .request(method.clone(), &url)
        .timeout(Duration::from_secs(60));

    if matches!(
        method,
        reqwest::Method::POST | reqwest::Method::PUT | reqwest::Method::PATCH
    ) && !body.is_empty()
    {
        request = request.body(body);
    }

    // 发送请求
    let res = match request.send().await {
        Ok(res) => res,
        Err(err) => {
            let msg = format!("Request failed: {}", err);
            send_error_event(&window, event_name, request_id, msg.clone()).await;
            return Ok(StreamResponse {
                request_id,
                status: 599,
                status_text: "Network Error".into(),
                headers: HashMap::new(),
            });
        }
    };

    // 构造响应头信息
    let mut headers = HashMap::new();
    for (name, value) in res.headers() {
        headers.insert(
            name.as_str().to_string(),
            value.to_str().unwrap_or("").to_string(),
        );
    }
    let status = res.status().as_u16();

    // 异步处理响应流
    let mut stream = res.bytes_stream();
    let window_clone = window.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(bytes) => {
                    // 尝试转为 UTF-8，否则使用 base64 兜底
                    let chunk_str = match String::from_utf8(bytes.to_vec()) {
                        Ok(s) => s,
                        Err(_) => base64::encode(bytes),
                    };

                    if let Err(e) = window_clone.emit(
                        event_name,
                        ChunkPayload {
                            request_id,
                            chunk: chunk_str,
                        },
                    ) {
                        eprintln!("Failed to emit chunk: {:?}", e);
                    }
                }
                Err(e) => {
                    eprintln!("Stream error: {:?}", e);
                    break;
                }
            }
        }

        if let Err(e) = window_clone.emit(event_name, EndPayload { request_id, status }) {
            eprintln!("Failed to emit end payload: {:?}", e);
        }
    });

    Ok(StreamResponse {
        request_id,
        status,
        status_text: "OK".into(),
        headers,
    })
}

async fn send_error_event(window: &tauri::Window, event_name: &str, request_id: u32, msg: String) {
    let _ = window.emit(
        event_name,
        ChunkPayload {
            request_id,
            chunk: msg.clone(),
        },
    );
    let _ = window.emit(
        event_name,
        EndPayload {
            request_id,
            status: 0,
        },
    );
}
