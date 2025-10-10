#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Mutex;
use tauri::async_runtime;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncBufReadExt;
use tokio::process::Child;

// 你的模块
mod cleanup;
mod constants;
mod logger;
mod mcp;
mod request;
mod stream;

use crate::constants::{HOST_SERVER_EVENT_NAME, HOST_SERVER_READY_TEXT};

// ----------------- 全局状态 -----------------
pub struct HostServerProcess(pub Mutex<Option<Child>>);

// ----------------- Tauri 命令 -----------------
#[tauri::command]
fn log_from_frontend(level: String, message: String) {
    match level.as_str() {
        "trace" => log::trace!("React: {}", message),
        "debug" => log::debug!("React: {}", message),
        "info" => log::info!("React: {}", message),
        "warn" => log::warn!("React: {}", message),
        "error" => log::error!("React: {}", message),
        _ => log::info!("React [unknown]: {}", message),
    }
}

#[tauri::command]
fn export_log_zip_cmd(app: AppHandle) -> Result<String, String> {
    logger::export_log_zip(app)
}

// ----------------- 启动子进程 -----------------
fn start_host_server(app: &AppHandle, state: tauri::State<HostServerProcess>) {
    let binary_path: PathBuf = get_host_server_path(app);
    let config = app.config();
    let mcp_config_path = mcp::get_user_config_path(app).expect("Cannot get MCP config path");

    log::info!("Starting host_server: {:?}", binary_path);

    let new_path = append_bin_to_path(app);
    let port = 6888;

    let mut child = tokio::process::Command::new(binary_path)
        .args([
            "--config_file",
            &mcp_config_path.to_string_lossy(),
            "--disable_reload",
            "--enable_authorization",
            "--port",
            &port.to_string(),
        ])
        .env("PATH", new_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start host_server");

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    *state.0.lock().unwrap() = Some(child);

    let app_clone = app.clone();
    async_runtime::spawn(async move {
        let mut reader = tokio::io::BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            log::info!("host_server stdout: {}", line);
            let expected_ready_text = format!("{}{}", HOST_SERVER_READY_TEXT, port);
            if line.contains(&expected_ready_text) {
                if let Err(e) = app_clone.emit(HOST_SERVER_EVENT_NAME, Some(port)) {
                    log::error!("Emit event failed: {}", e);
                }
            }
        }
    });

    async_runtime::spawn(async move {
        let mut reader = tokio::io::BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            log::error!("host_server stderr: {}", line);
        }
    });
}

// ----------------- 获取路径 -----------------
fn get_host_server_path(app: &AppHandle) -> PathBuf {
    #[cfg(target_os = "macos")]
    let binary_name = "host_server_macos";
    #[cfg(target_os = "linux")]
    let binary_name = "host_server_linux";
    #[cfg(target_os = "windows")]
    let binary_name = "host_server_windows.exe";

    if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .join(format!("../bin/{}", binary_name))
    } else {
        app.path()
            .resource_dir()
            .unwrap()
            .join("resources")
            .join(binary_name)
    }
}

fn append_bin_to_path(app: &AppHandle) -> String {
    let bin_dir = if cfg!(debug_assertions) {
        std::env::current_dir().unwrap().join("bin")
    } else {
        app.path().resource_dir().unwrap().join("bin")
    };

    let bin_str = bin_dir.to_string_lossy();
    let env_path = std::env::var("PATH").unwrap_or_default();
    format!("{}:{}", bin_str, env_path)
}

// ----------------- 主函数 -----------------
#[tokio::main]
async fn main() {
    // 禁止图标 panic（如果 icon 缺失）
    std::env::set_var("TAURI_NO_ICON_CHECK", "1");

    tauri::Builder::default()
        // --- 官方插件 ---
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        // updater 改为 builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        // --- 全局状态 ---
        .manage(HostServerProcess(Mutex::new(None)))
        // --- 注册命令 ---
        .invoke_handler(tauri::generate_handler![
            log_from_frontend,
            export_log_zip_cmd,
            stream::stream_fetch,
            request::fetch_no_proxy,
            mcp::read_mcp_config,
            mcp::write_mcp_config,
        ])
        // --- 初始化逻辑 ---
        .setup(|app| {
            log::info!("AidenAI started successfully!");
            let handle = app.handle();
            let state = app.state::<HostServerProcess>();
            start_host_server(&handle, state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error running Tauri app");
}
