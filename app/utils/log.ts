export async function exportAndDownloadLog() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const { downloadDir } = await import("@tauri-apps/api/path");
    const zipPath: string = await invoke("export_log_zip_cmd");
    const downloadsPath = await downloadDir();

    // Open the downloads folder using Rust command
    await invoke("open_folder_cmd", { path: downloadsPath });

    console.log("日志文件导出成功:", zipPath);
  } catch (error) {
    console.error("日志导出失败:", error);
    throw error;
  }
}
