use std::{fs::File, io::Write, path::PathBuf};
use tauri::{path::BaseDirectory, AppHandle, Manager}; // 导入 BaseDirectory
use tauri_plugin_fs::{File as FsFile, FsExt, OpenOptions};
use time::OffsetDateTime;
use tokio::io::AsyncWriteExt;
use zip::write::{ExtendedFileOptions, FileOptions};
use zip::CompressionMethod;

// 移除错误的导入：use tauri_plugin_path::{BaseDirectory, PathExt};

/// 获取日志文件路径: ~/Library/Application Support/[AppName]/Logs/aiden.log
pub fn get_log_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let base_path = app.path().app_data_dir().ok_or("无法获取应用数据目录")?;
    let mut path = base_path.join("Logs");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("aiden.log");
    Ok(path)
}

/// 导出日志为 zip 文件，返回 zip 文件的路径 (tauri v2 版)
#[tauri::command]
pub async fn export_log_zip(app: AppHandle) -> Result<String, String> {
    let log_file: PathBuf = get_log_file_path(&app)?;
    let log_path = log_file.parent().ok_or("日志文件路径无效")?;

    if !app.fs().exists(log_path).await {
        return Err("日志目录不存在".into());
    }

    let log_entries = app
        .fs()
        .read_dir(log_path)
        .await
        .map_err(|e| e.to_string())?;

    let mut log_files = log_entries
        .into_iter()
        .filter_map(|entry| {
            let path = entry.path;
            if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                Some(path)
            } else {
                None
            }
        })
        .collect::<Vec<_>>();

    log_files.sort_by_key(|path| {
        std::fs::metadata(path)
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
    });
    log_files.reverse();

    let latest_logs = log_files.into_iter().take(3).collect::<Vec<_>>();

    let downloads = app.path().download_dir().ok_or("无法获取下载目录")?;

    let timestamp = OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "log".into());

    let zip_path = downloads.join(format!("aiden-logs-{}.zip", timestamp.replace(":", "-")));

    let zip_file = FsFile::create(&zip_path, &app)
        .await
        .map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(zip_file);
    let options: FileOptions<'_, ExtendedFileOptions> =
        FileOptions::default().compression_method(CompressionMethod::Deflated);

    for log_file in latest_logs {
        let file_name = log_file
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or("unknown.log");

        let data = app.fs().read(&log_file).await.map_err(|e| e.to_string())?;

        zip.start_file(file_name, options.clone())
            .map_err(|e| e.to_string())?;

        zip.write_all(&data).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(zip_path.to_string_lossy().to_string())
}
