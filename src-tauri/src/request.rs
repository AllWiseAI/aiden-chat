#[derive(serde::Deserialize)]
pub struct FetchOptions {
    url: String,
    method: String,
    body: Option<String>,
    headers: Option<std::collections::HashMap<String, String>>,
}

#[derive(serde::Serialize)]
pub struct FetchResponse {
    status: u16,
    status_text: String,
    body: String,
}

#[tauri::command]
pub async fn fetch_no_proxy(options: FetchOptions) -> Result<FetchResponse, String> {
    let client = reqwest::Client::builder()
        .no_proxy()
        .build()
        .map_err(|e| e.to_string())?;

    let mut request: reqwest::RequestBuilder = client.request(options.method.parse().unwrap(), &options.url);

    if let Some(headers) = options.headers {
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
    }

    if let Some(body) = options.body {
        request = request.body(body);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("")
        .to_string();
    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(FetchResponse {
        status,
        status_text,
        body,
    })
}
