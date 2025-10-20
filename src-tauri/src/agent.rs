use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use std::fs;
use std::path::PathBuf;
use tauri::{api::path::app_data_dir, AppHandle, Config};

pub fn get_user_config_path(config: &Config) -> Option<PathBuf> {
  let mut path: PathBuf = app_data_dir(config)?;
  path.push("Config");
  std::fs::create_dir_all(&path).ok()?;
  path.push("agent.config.json");
  Some(path)
}

pub fn get_user_config_path_from_app(app: &tauri::AppHandle) -> Option<PathBuf> {
  let config = app.config();
  get_user_config_path(&config)
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub version: String,
    pub syncVersion: String,
    pub agents: Vec<serde_json::Value>,
}

/// 读取配置
#[tauri::command]
pub fn read_agent_config(app: AppHandle) -> Result<AgentConfig, String> {
  let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
  log::info!("测试, 读取的文件路径为={}", path.display());
  let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
  let config: AgentConfig = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
  Ok(config)
}

/// 写入配置
#[tauri::command]
pub fn write_agent_config(app: AppHandle, new_config: AgentConfig) -> Result<(), String> {
    let path = get_user_config_path_from_app(&app).ok_or("配置路径不存在")?;
    let json_str = serde_json::to_string_pretty(&new_config).map_err(|e| e.to_string())?;
    fs::write(&path, json_str).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn init_agent_config(app: &tauri::App) -> Result<(), String> {
  let config = app.config();
  let user_config_path =
      get_user_config_path(&config).ok_or("Failed to get Agent config file path.")?;

  let default_path: PathBuf = app
      .path_resolver()
      .resolve_resource("resources/agent.config.json")
      .ok_or("Cannot find default Agent config in resources.")?;

  // 首次安装，用户 config 不存在
  if !user_config_path.exists() {
      fs::copy(&default_path, &user_config_path)
          .map_err(|e| format!("Copy Agent config failed: {}", e))?;
      log::info!("Agent config initialized: {:?}", user_config_path);
      return Ok(());
  }

  // 读取默认 config
  let default_text = fs::read_to_string(&default_path)
      .map_err(|e| format!("Failed to read default Agent config: {}", e))?;
  let default_json: Value = serde_json::from_str(&default_text)
      .map_err(|e| format!("Invalid JSON in default config: {}", e))?;

  // 读取用户 config
  let user_text = fs::read_to_string(&user_config_path)
      .map_err(|e| format!("Failed to read user Agent config: {}", e))?;
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
      "Agent config syncVersion: default={}, user={}",
      default_sync,
      user_sync
  );

  if default_sync > user_sync {
      fs::copy(&default_path, &user_config_path)
          .map_err(|e| format!("Forced sync copy failed: {}", e))?;
      log::info!(
          "Agent config forcibly synced due to syncVersion mismatch: {} -> {}",
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
          "Agent config update needed: {} -> {}",
          user_version,
          default_version
      );

      let empty_array: Vec<Value> = Vec::new();
      let default_agents = default_json
            .get("agents")
            .and_then(|v| v.as_array())
            .unwrap_or(&empty_array);

      
      let mut user_agents = user_json
          .get("agents")
          .and_then(|v| v.as_array().cloned())
          .unwrap_or_else(Vec::new);
      
      // 过滤掉用户配置中所有 builtIn 类型的 agent
      user_agents.retain(|agent| {
          agent.get("source").map_or(true, |s| s != "builtIn")
      });

      // 添加默认配置中的所有 builtIn agent
      for default_agent in default_agents {
          if default_agent.get("source") == Some(&Value::String("builtIn".into())) {
              user_agents.push(default_agent.clone());
          }
      }

      user_json["agents"] = Value::Array(user_agents);
      user_json["version"] = Value::String(default_version.to_string());

      fs::write(
          &user_config_path,
          serde_json::to_string_pretty(&user_json).unwrap(),
      )
      .map_err(|e| format!("Failed to write updated Agent config: {}", e))?;

      log::info!("Agent config upgraded successfully.");
  }

  Ok(())
}
