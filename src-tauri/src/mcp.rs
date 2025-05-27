use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use std::fs;
use std::path::PathBuf;
use tauri::{api::path::app_data_dir, AppHandle, Config};

/// eg: ~/Library/Application Support/com.aiden.chat/Config/mcp.config.json
pub fn get_user_config_path(config: &Config) -> Option<PathBuf> {
    let mut path: PathBuf = app_data_dir(config)?;
    path.push("Config");
    std::fs::create_dir_all(&path).ok()?;
    path.push("mcp.config.json");
    Some(path)
}

pub fn get_user_config_path_from_app(app: &tauri::AppHandle) -> Option<PathBuf> {
    let config = app.config();
    get_user_config_path(&config)
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPConfig {
    pub version: String,
    pub mcpServers: serde_json::Map<String, serde_json::Value>,
    pub a2aServers: Option<serde_json::Value>,
}

/// 读取配置
#[tauri::command]
pub fn read_mcp_config(app: AppHandle) -> Result<MCPConfig, String> {
    let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config: MCPConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    Ok(config)
}

/// 写入配置
#[tauri::command]
pub fn write_mcp_config(app: AppHandle, new_config: MCPConfig) -> Result<(), String> {
    let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
    let json_str = serde_json::to_string_pretty(&new_config).map_err(|e| e.to_string())?;
    fs::write(&path, json_str).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn init_mcp_config(app: &tauri::App) -> Result<(), String> {
    let config = app.config();
    let user_config_path =
        get_user_config_path(&config).ok_or("Failed to get MCP config file path.")?;

    let default_path: PathBuf = app
        .path_resolver()
        .resolve_resource("resources/mcp.config.json")
        .ok_or("Cannot find default MCP config in resources.")?;

    if !user_config_path.exists() {
        fs::copy(&default_path, &user_config_path)
            .map_err(|e| format!("Copy MCP config failed: {}", e))?;
        log::info!("MCP config initialized: {:?}", user_config_path);
        return Ok(());
    }

    let default_text = fs::read_to_string(&default_path)
        .map_err(|e| format!("Failed to read default MCP config: {}", e))?;
    let default_json: Value = serde_json::from_str(&default_text)
        .map_err(|e| format!("Invalid JSON in default config: {}", e))?;

    let user_text = fs::read_to_string(&user_config_path)
        .map_err(|e| format!("Failed to read user MCP config: {}", e))?;
    let mut user_json: Value = serde_json::from_str(&user_text)
        .map_err(|e| format!("Invalid JSON in user config: {}", e))?;

    let default_version = default_json
        .get("version")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let user_version = user_json
        .get("version")
        .and_then(|v: &Value| v.as_str())
        .unwrap_or("");
    log::info!(
        "MCP config version: default={}, user={}",
        default_version,
        user_version
    );
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

        fs::write(
            &user_config_path,
            serde_json::to_string_pretty(&user_json).unwrap(),
        )
        .map_err(|e| format!("Failed to write updated MCP config: {}", e))?;

        log::info!("MCP config upgraded successfully.");
    }

    Ok(())
}
