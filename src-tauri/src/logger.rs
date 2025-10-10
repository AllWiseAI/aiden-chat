use std::{fs::File, io::Write, path::PathBuf};
use tauri::AppHandle;
use tauri_plugin_path::{BaseDirectory, PathResolverExt};
use time::OffsetDateTime;
use zip::write::{ExtendedFileOptions, FileOptions};
use zip::CompressionMethod;

/// 获取日志文件路径: ~/Library/Application Support/[AppName]/Logs/aiden.log
pub fn get_log_file_path(app: &AppHandle) -> Option<PathBuf> {
    let base_path = app.path().app_data_dir().ok()?;
    let mut path = base_path.join("Logs");
    std::fs::create_dir_all(&path).ok()?;
    path.push("aiden.log");
    Some(path)
}

/// 导出日志为 zip 文件，返回 zip 文件的路径
pub fn export_log_zip(app: AppHandle) -> Result<String, String> {
    let log_file: PathBuf = get_log_file_path(&app).ok_or("无法获取日志文件路径")?;
    let log_path = log_file.parent().unwrap();
    println!("log_path: {:?}", log_path);
    if !log_path.exists() {
        return Err("日志文件不存在".into());
    }

    // 获取所有 .log 文件
    let mut log_files: Vec<_> = std::fs::read_dir(&log_path)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                Some(path)
            } else {
                None
            }
        })
        .collect();

    // 按修改时间排序（新 -> 旧）
    log_files.sort_by_key(|path| {
        std::fs::metadata(path)
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
    });
    log_files.reverse(); // 最近的在前面

    let latest_logs = log_files.into_iter().take(3).collect::<Vec<_>>();

    // 使用 Tauri v2 插件获取下载目录
    let downloads = app
        .path()
        .download_dir()
        .map_err(|_| "无法获取下载目录".to_string())?;

    let timestamp = OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "log".into());

    let zip_path = downloads.join(format!("aiden-logs-{}.zip", timestamp.replace(":", "-")));

    // 开始写 zip 文件
    let zip_file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(zip_file);
    let options: FileOptions<'_, ExtendedFileOptions> =
        FileOptions::default().compression_method(CompressionMethod::Deflated);

    for log_file in latest_logs {
        let file_name = log_file
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or("unknown.log");
        let data = std::fs::read(&log_file).map_err(|e| e.to_string())?;
        zip.start_file(file_name, options.clone())
            .map_err(|e| e.to_string())?;
        zip.write_all(&data).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(zip_path.to_string_lossy().to_string())
}
