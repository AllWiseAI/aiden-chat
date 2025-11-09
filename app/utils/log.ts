export async function exportAndDownloadLog() {
  try {
    const { invoke } = await import("@tauri-apps/api");
    const { open } = await import("@tauri-apps/plugin-shell");
    const { downloadDir } = await import("@tauri-apps/api/path");
    const zipPath: string = await invoke("export_log_zip_cmd");
    const downloadsPath = await downloadDir();
    await open(downloadsPath);
    console.log("日志文件导出成功:", zipPath);
  } catch (error) {
    console.error("日志导出失败:", error);
  }
}
