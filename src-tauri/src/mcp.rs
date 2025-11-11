use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use std::fs;
use std::path::{PathBuf};
use tauri::{AppHandle, Manager};

/// eg: ~/Library/Application Support/com.aiden.chat/Config/mcp.config.json
pub fn get_user_config_path<R: tauri::Runtime>(app_handle: &AppHandle<R>) -> Option<PathBuf> {
    let mut path: PathBuf = app_handle.path().app_data_dir().ok()?;
    path.push("Config");
    std::fs::create_dir_all(&path).ok()?;
    path.push("mcp.config.json");
    Some(path)
}

pub fn get_user_config_path_from_app(app: &tauri::AppHandle) -> Option<PathBuf> {
    get_user_config_path(app)
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPConfig {
    pub version: String,
    pub syncVersion: String,
    pub mcpServers: serde_json::Map<String, serde_json::Value>,
    pub a2aServers: Option<serde_json::Value>,
}

/// 读取配置
#[tauri::command]
pub async fn read_mcp_config(app: AppHandle) -> Result<MCPConfig, String> {
    let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config: MCPConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(config)
}

/// 写入配置
#[tauri::command]
pub async fn write_mcp_config(app: AppHandle, new_config: MCPConfig) -> Result<(), String> {
    let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
    let json_str = serde_json::to_string_pretty(&new_config).map_err(|e| e.to_string())?;
    fs::write(&path, json_str).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn init_mcp_config(app: &tauri::App) -> Result<(), String> {
    let app_handle = app.handle();
    let user_config_path =
        get_user_config_path(&app_handle).ok_or("Failed to get MCP config file path.")?;

    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot get resource dir: {}", e))?;
    let default_path: PathBuf = resource_dir.join("resources/mcp.config.json");

    // 首次安装，用户 config 不存在
    if !user_config_path.exists() {
        fs::copy(&default_path, &user_config_path)
            .map_err(|e| format!("Copy MCP config failed: {}", e))?;
        log::info!("MCP config initialized: {:?}", user_config_path);
        return Ok(());
    }

    // 读取默认 config
    let default_text = fs::read_to_string(&default_path)
        .map_err(|e| format!("Failed to read default MCP config: {}", e))?;
    let default_json: Value = serde_json::from_str(&default_text)
        .map_err(|e| format!("Invalid JSON in default config: {}", e))?;

    // 读取用户 config
    let user_text = fs::read_to_string(&user_config_path)
        .map_err(|e| format!("Failed to read user MCP config: {}", e))?;
    let mut user_json: Value = serde_json::from_str(&user_text)
        .map_err(|e: serde_json::Error| format!("Invalid JSON in user config: {}", e))?;

    // ========= Step 1: 强制 syncVersion 同步判断 ============
    let default_sync_str = default_json
        .get("syncVersion")
        .and_then(|v| v.as_str())
        .unwrap_or("0.0.0");
    let user_sync_str = user_json
        .get("syncVersion")
        .and_then(|v| v.as_str())
        .unwrap_or("0.0.0");

    let default_sync = Version::parse(default_sync_str).unwrap_or_else(|_| Version::new(0, 0, 0));
    let user_sync = Version::parse(user_sync_str).unwrap_or_else(|_| Version::new(0, 0, 0));

    log::info!(
        "MCP config syncVersion: default={}, user={}",
        default_sync,
        user_sync
    );

    if default_sync > user_sync {
        fs::copy(&default_path, &user_config_path)
            .map_err(|e| format!("Forced sync copy failed: {}", e))?;
        log::info!(
            "MCP config forcibly synced due to syncVersion mismatch: {} -> {}",
            user_sync,
            default_sync
        );
        return Ok(());
    }

    // ========= Step 2: 正常 version 增量更新逻辑 ============
    let default_version_str = default_json
        .get("version")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let user_version_str = user_json
        .get("version")
        .and_then(|v: &Value| v.as_str())
        .unwrap_or("");

    log::info!(
        "MCP config version: default={}, user={}",
        default_version_str,
        user_version_str
    );

    let default_version =
        Version::parse(default_version_str).unwrap_or_else(|_| Version::new(0, 0, 0));
    let user_version = Version::parse(user_version_str).unwrap_or_else(|_| Version::new(0, 0, 0));

    if default_version > user_version {
        log::info!(
            "MCP config update needed: {} -> {}",
            user_version,
            default_version
        );

        let mut updated_servers =
            if let Some(user_servers) = user_json.get("mcpServers").and_then(|v| v.as_object()) {
                user_servers
                    .iter()
                    .filter(|(_, v)| v.get("aiden_type").map(|t| t != "default").unwrap_or(true))
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect::<Map<String, Value>>()
            } else {
                Map::new()
            };

        if let Some(default_servers) = default_json.get("mcpServers").and_then(|v| v.as_object()) {
            for (k, v) in default_servers {
                if v.get("aiden_type") == Some(&Value::String("default".into())) {
                    updated_servers.insert(k.clone(), v.clone());
                }
            }
        }

        user_json["mcpServers"] = Value::Object(updated_servers);
        user_json["version"] = Value::String(default_version.to_string());

        if let Some(default_a2a) = default_json.get("a2aServers") {
            user_json["a2aServers"] = default_a2a.clone();
        }

        fs::write(
            &user_config_path,
            serde_json::to_string_pretty(&user_json).unwrap(),
        )
        .map_err(|e| format!("Failed to write updated MCP config: {}", e))?;

        log::info!("MCP config upgraded successfully.");
    }

    Ok(())
}
