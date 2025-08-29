mod constants;
mod logger;
mod mcp;
mod request;
mod stream;
mod cleanup;

use crate::constants::{HOST_SERVER_EVENT_NAME, HOST_SERVER_READY_TEXT, PORTS_TO_KILL};
use dotenvy;
use flexi_logger::{Duplicate, FileSpec, Logger, WriteMode};
use sentry;
use std::env;
use std::path::PathBuf;
use std::process::{Command as StdCommand, Stdio as StdStdio};
use std::sync::Mutex;
use tauri::api::path::resource_dir;
use tauri::{AppHandle, Manager, Runtime, State};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tokio::io::AsyncBufReadExt;
use tokio::process::{Child, Command as TokioCommand};
use tokio::task;
use std::net::TcpListener;


pub struct HostServerProcess(pub Mutex<Option<Child>>);

// Tauri command to handle logs from the frontend
#[tauri::command]
fn log_from_frontend(level: String, message: String) {
    match level.as_str() {
        "trace" => log::trace!("React: {}", message),
        "debug" => log::debug!("React: {}", message),
        "info" => log::info!("React: {}", message),
        "warn" => log::warn!("React: {}", message),
        "error" => log::error!("React: {}", message),
        _ => log::info!("React [unknown level]: {}", message),
    }
}

fn get_env_path<R: Runtime>(app: &AppHandle<R>) -> Option<PathBuf> {
    if cfg!(debug_assertions) {
        Some(
            std::env::current_dir()
                .ok()
                .map(|dir: PathBuf| dir.join("../.env"))?,
        )
    } else {
        resource_dir(app.package_info(), &app.env()).map(|dir: PathBuf| dir.join("bin/.env"))
    }
}

fn get_host_server_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    #[cfg(target_os = "macos")]
    let binary_name = "host_server_macos";

    #[cfg(target_os = "linux")]
    let binary_name = "host_server_linux";

    #[cfg(target_os = "windows")]
    let binary_name = "host_server_windows";

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    let binary_name = "host_server_macos";

    if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .join(format!("../node_modules/{}/{}", binary_name, binary_name))
    } else {
        resource_dir(app.package_info(), &app.env())
            .unwrap()
            .join(format!("resources/{}/{}", binary_name, binary_name))
    }
}

fn get_shell_path() -> Option<String> {
    let output = StdCommand::new("/bin/zsh")
        .args(&["-ilc", "env"])
        .output()
        .ok()?;
    let env_str = String::from_utf8_lossy(&output.stdout);
    for line in env_str.lines() {
        if let Some(path) = line.strip_prefix("PATH=") {
            return Some(path.to_string());
        }
    }
    None
}

fn append_bin_to_path<R: Runtime>(app: &AppHandle<R>) -> String {
    let bin_dir = if cfg!(debug_assertions) {
        std::env::current_dir().unwrap().join("bin")
    } else {
        resource_dir(app.package_info(), &app.env())
            .unwrap()
            .join("bin")
    };
    let bin_dir_str = bin_dir.to_string_lossy();
    let shell_path = get_shell_path().unwrap_or_else(|| std::env::var("PATH").unwrap_or_default());
    let sep: &'static str = if cfg!(target_os = "windows") {
        ";"
    } else {
        ":"
    };
    format!("{}{}{}", bin_dir_str, sep, shell_path)
}

fn find_free_port() -> Option<u16> {
    TcpListener::bind("127.0.0.1:0")
        .ok()
        .and_then(|listener| listener.local_addr().ok())
        .map(|addr| addr.port())
}

fn start_host_server<R: Runtime>(app: &AppHandle<R>, state: State<HostServerProcess>) {
    let binary_path: PathBuf = get_host_server_path(app);
    let config = app.config();
    let mcp_config_path = mcp::get_user_config_path(&config).expect("Cannot get MCP config path");
    log::info!("Starting host server from: {:?}", binary_path);
    log::info!("Using config file from: {:?}", mcp_config_path);

    let new_path = append_bin_to_path(app);
    log::info!("Setting PATH to host_server: {}", new_path);
    let port = if cfg!(debug_assertions) {
        log::info!("Development mode, using fixed port 6888");
        6888
    } else {
        let free_port = find_free_port().expect("Failed to find a free port");
        log::info!("Production mode, using dynamic port: {}", free_port);
        free_port
    };

    let mut child: Child = TokioCommand::new(binary_path.to_string_lossy().to_string())
        .args([
            "--config_file".into(),
            mcp_config_path.to_string_lossy().to_string(),
            "--disable_reload".into(),
            "--enable_authorization".into(),
            "--port".into(),
            port.to_string(),
        ])
        .envs(env::vars())
        .env("PATH", new_path)
        .stdout(StdStdio::piped())
        .stderr(StdStdio::piped())
        .spawn()
        .expect("Failed to start host_server");

    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let stderr = child.stderr.take().expect("Failed to capture stderr");

    // 保存子进程到全局状态
    *state.0.lock().unwrap() = Some(child);
    let app_clone = app.clone();
    task::spawn(async move {
        let reader = tokio::io::BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            log::info!("host_server stdout: {}", line);
            let expected_ready_text = format!("{}{}", HOST_SERVER_READY_TEXT, port);
            if line.contains(&expected_ready_text) {
                if let Err(e) = app_clone.emit_all(HOST_SERVER_EVENT_NAME, port) {
                    log::error!("Failed to emit event to frontend: {}", e);
                }
            }
        }
    });

    task::spawn(async move {
        let reader = tokio::io::BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            log::error!("host_server stderr: {}", line);
            sentry::capture_message(
                &format!("host_server stderr: {}", line),
                sentry::Level::Error,
            );
        }
    });
}

fn kill_ports(ports: &[u16]) {
    #[cfg(target_family = "unix")]
    for port in ports {
        log::info!("Checking port {}...", port);
        let output: Result<std::process::Output, std::io::Error> = StdCommand::new("lsof")
            .arg("-ti")
            .arg(format!(":{}", port))
            .output();

        if let Ok(output) = output {
            let pids = String::from_utf8_lossy(&output.stdout);
            for pid in pids.lines() {
                if !pid.trim().is_empty() {
                    log::info!("Killing process {} on port {}", pid, port);
                    let _ = StdCommand::new("kill").arg("-9").arg(pid).output();
                }
            }
        }
    }
}

fn cleanup_processes<R: Runtime>(_app: &AppHandle<R>, state: State<HostServerProcess>) {
    let mut guard = state.0.lock().unwrap();
    if guard.is_some() {
        log::info!("Attempting to kill all related processes (host_server, aiden)...");
        #[cfg(unix)]
        {
            use std::process::Command;
            let patterns = ["host_server"];
            for pattern in patterns.iter() {
                let cmd = format!("pgrep -f '{}' | grep -v $$ | xargs -r kill -9", pattern);
                log::info!("Executing cleanup command: {}", cmd);

                let output = Command::new("sh").arg("-c").arg(&cmd).output();
                log::info!("Command executed, checking output...");

                match output {
                    Ok(out) => {
                        if !out.stdout.is_empty() {
                            log::info!(
                                "Killed processes matching '{}':\n{}",
                                pattern,
                                String::from_utf8_lossy(&out.stdout)
                            );
                        } else {
                            log::info!("No running processes matched '{}'", pattern);
                        }
                        if !out.stderr.is_empty() {
                            log::warn!(
                                "Stderr while killing '{}':\n{}",
                                pattern,
                                String::from_utf8_lossy(&out.stderr)
                            );
                        }
                    }
                    Err(e) => {
                        log::error!(
                            "Failed to execute cleanup command for '{}': {:?}",
                            pattern,
                            e
                        );
                    }
                }
            }
        }
        *guard = None;
    } else {
        log::warn!("No host_server process was running.");
    }
}

#[tauri::command]
fn export_log_zip_cmd(app: tauri::AppHandle) -> Result<String, String> {
    logger::export_log_zip(app)
}

#[tokio::main]
async fn main() {
    let is_prod = !cfg!(debug_assertions);

    let _sentry_guard = if is_prod {
        Some(sentry::init((
            "https://6598ac3fc1e35c15c14cbd94e7a73b3b@sentry.aidenai.io/3",
            sentry::ClientOptions {
                release: sentry::release_name!(),
                ..Default::default()
            },
        )))
    } else {
        println!("Sentry is disabled in development mode");
        None
    };

    let setting = CustomMenuItem::new("open_setting".to_string(), "Setting");

    let app_submenu = Submenu::new(
        "App",
        Menu::new()
            .add_item(setting)
            .add_native_item(MenuItem::Quit),
    );

    let edit_submenu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll),
    );

    let menu = Menu::new()
        .add_submenu(app_submenu)
        .add_submenu(edit_submenu);

    let context = tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "open_setting" => {
                let _ = event.window().emit("open-setting", {});
            }
            _ => {}
        })
        .manage(HostServerProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            log_from_frontend,
            export_log_zip_cmd,
            stream::stream_fetch,
            request::fetch_no_proxy,
            mcp::read_mcp_config,
            mcp::write_mcp_config,
        ])
        // 监听窗口关闭事件
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                api.prevent_close();
                let _ = event.window().minimize();
            }
        })
        .setup(|app: &mut tauri::App| {
            let config: std::sync::Arc<tauri::Config> = app.config();
            let log_file = logger::get_log_file_path(&config).expect("Failed to get log file path");
            let log_dir = log_file.parent().unwrap();
            let log_basename = log_file.file_stem().unwrap().to_str().unwrap();
            let log_suffix = log_file.extension().unwrap().to_str().unwrap();

            let file_spec = FileSpec::default()
                .directory(log_dir)
                .basename(log_basename)
                .suffix(log_suffix);

            Logger::try_with_str("info")
                .unwrap()
                .log_to_file(file_spec)
                .duplicate_to_stdout(Duplicate::Info)
                .write_mode(WriteMode::BufferAndFlush)
                .start()
                .unwrap();

            log::info!("AidenAI started successfully!");
            cleanup::cleanup_database(&config);
            kill_ports(PORTS_TO_KILL);
            let app_handle: AppHandle = app.handle();
            let env_path: PathBuf = get_env_path(&app_handle).expect("Cannot find .env");
            log::info!("Loading env from: {:?}", env_path);
            dotenvy::from_path(env_path).ok();
            for key in [
                "NPM_CONFIG_REGISTRY",
                "UV_INDEX",
                "UV_DEFAULT_INDEX",
                "UV_EXTRA_INDEX_URL",
                "HOST_SERVER_VERSION",
            ] {
                match env::var(key) {
                    Ok(value) => log::info!("{key} = {value}"),
                    Err(_) => log::info!("{key} is not set"),
                }
            }
            let _ = mcp::init_mcp_config(app);
            let state: State<'_, HostServerProcess> = app.state::<HostServerProcess>();
            start_host_server(&app_handle, state);

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    context.run(|app_handle, event| {
        if let tauri::RunEvent::Exit { .. } = event {
            log::info!("App is exiting — now cleaning processes");
            let state: State<'_, HostServerProcess> = app_handle.state::<HostServerProcess>();
            cleanup_processes(&app_handle, state);
        }
    });

    if let Some(sentry_guard) = _sentry_guard {
        sentry_guard.flush(Some(std::time::Duration::from_secs(2)));
    }
}
