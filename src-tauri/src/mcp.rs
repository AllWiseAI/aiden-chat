use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::path::PathBuf;

use tauri::{async_runtime::block_on, AppHandle, Manager};
// 导入 BaseDirectory
use tauri::path::BaseDirectory;
// 导入文件系统插件提供的扩展，但注意它来自 `tauri-plugin-fs` 而非 `tauri`
use tauri_plugin_fs::FsExt;

// 移除错误的导入：
// use tauri_plugin_path::{BaseDirectory, PathExt};

/// 获取用户配置路径
pub fn get_user_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    // 使用 tauri::path::app_data_dir()
    let mut path: PathBuf = app
        .path()
        .app_data_dir()
        .ok_or("Failed to get app data dir.")?;
    path.push("Config");
    // std::fs::create_dir_all 是同步操作，这里使用它没问题
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("mcp.config.json");
    Ok(path)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPConfig {
    pub version: String,
    pub syncVersion: String,
    pub mcpServers: Map<String, Value>,
    pub a2aServers: Option<Value>,
}

/// 读取配置 (v2版)
#[tauri::command]
pub async fn read_mcp_config(app: AppHandle) -> Result<MCPConfig, String> {
    let path = get_user_config_path(&app)?;
    // 使用文件系统插件的异步方法
    let contents = app
        .fs()
        .read_to_string(&path)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

/// 写入配置 (v2版)
#[tauri::command]
pub async fn write_mcp_config(app: AppHandle, new_config: MCPConfig) -> Result<(), String> {
    let path = get_user_config_path(&app)?;
    let json_str = serde_json::to_string_pretty(&new_config).map_err(|e| e.to_string())?;
    // 使用文件系统插件的异步方法
    app.fs()
        .write(&path, json_str)
        .await
        .map_err(|e| e.to_string())
}

/// 初始化 MCP 配置（tauri v2 版）
pub async fn init_mcp_config(app: &AppHandle) -> Result<(), String> {
    let user_config_path = get_user_config_path(app)?;

    // 默认资源文件路径，使用 tauri::path::resolve()
    let default_path: PathBuf = app
        .path()
        .resolve("resources/mcp.config.json", BaseDirectory::Resource)
        .ok_or("Cannot find default MCP config in resources.")?;

    // 使用文件系统插件的异步方法
    if !app.fs().exists(&user_config_path).await {
        app.fs()
            .copy(&default_path, &user_config_path)
            .await
            .map_err(|e| format!("Copy MCP config failed: {}", e))?;
        log::info!("MCP config initialized: {:?}", user_config_path);
        return Ok(());
    }

    // 读取默认配置 (异步)
    let default_text = app
        .fs()
        .read_to_string(&default_path)
        .await
        .map_err(|e| format!("Failed to read default MCP config: {}", e))?;
    let default_json: Value = serde_json::from_str(&default_text)
        .map_err(|e| format!("Invalid JSON in default config: {}", e))?;

    // 读取用户配置 (异步)
    let user_text = app
        .fs()
        .read_to_string(&user_config_path)
        .await
        .map_err(|e| format!("Failed to read user MCP config: {}", e))?;
    let mut user_json: Value = serde_json::from_str(&user_text)
        .map_err(|e| format!("Invalid JSON in user config: {}", e))?;

    // syncVersion 同步判断
    let default_sync = parse_version(default_json.get("syncVersion"));
    let user_sync = parse_version(user_json.get("syncVersion"));
    if default_sync > user_sync {
        app.fs()
            .copy(&default_path, &user_config_path)
            .await
            .map_err(|e| format!("Forced sync copy failed: {}", e))?;
        log::info!(
            "MCP config forcibly synced due to syncVersion mismatch: {} -> {}",
            user_sync,
            default_sync
        );
        return Ok(());
    }

    // 增量更新逻辑
    let default_version = parse_version(default_json.get("version"));
    let user_version = parse_version(user_json.get("version"));
    if default_version > user_version {
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

        // 使用文件系统插件的异步方法
        app.fs()
            .write(
                &user_config_path,
                serde_json::to_string_pretty(&user_json).unwrap(),
            )
            .await
            .map_err(|e| format!("Failed to write updated MCP config: {}", e))?;
        log::info!("MCP config upgraded successfully.");
    }

    Ok(())
}

fn parse_version(value: Option<&Value>) -> Version {
    let s = value.and_then(|v| v.as_str()).unwrap_or("0.0.0");
    Version::parse(s).unwrap_or_else(|_| Version::new(0, 0, 0))
}
