use std::fs;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use tauri::Config;

/// 清理 Database 文件夹，只执行一次
pub fn cleanup_database(config: &Config) {
    if let Some(mut base_dir) = app_data_dir(config) {
        // 标记文件
        let mut flag_file = base_dir.clone();
        flag_file.push("cleanup_done.flag");

        if flag_file.exists() {
            // 已经清理过，直接返回
            log::info!("Database cleanup already done, skipping.");
            return;
        }

        // Database 路径
        let mut db_dir = base_dir.clone();
        db_dir.push("Database");

        if db_dir.exists() {
            match fs::remove_dir_all(&db_dir) {
                Ok(_) => log::info!("Database directory removed successfully."),
                Err(e) => log::warn!("Failed to remove Database directory: {}", e),
            }
        } else {
            log::info!("Database directory not found, nothing to clean.");
        }

        // 创建标记文件
        if let Err(e) = fs::write(&flag_file, b"done") {
            log::warn!("Failed to create cleanup flag file: {}", e);
        }
    }
}
