import { useEffect, useState, useCallback } from "react";
import { app, shell } from "@tauri-apps/api";
import { relaunch } from "@tauri-apps/api/process";

import { join } from "@tauri-apps/api/path";
import { exists, writeBinaryFile, removeFile } from "@tauri-apps/api/fs";
import { fetch, ResponseType } from "@tauri-apps/api/http";
import { platform, arch } from "@tauri-apps/api/os";
import { appDataDir } from "@tauri-apps/api/path";

const useDataDir = await appDataDir();

type PlatformMap = {
  [platformKey: string]: {
    url: string;
    signature?: string;
  };
};

type VersionInfo = {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms: PlatformMap;
};

async function getPlatformKey() {
  const os = await platform(); // "darwin", "win32", "linux"
  const architecture = await arch(); // "x86_64", "aarch64" 等

  return `${os}-${architecture}`; // 如 darwin-aarch64
}

const updateJsonUrl =
  "https://github.com/AllWiseAI/aiden-chat/releases/latest/download/latest.json";

function compareVersions(v1: string, v2: string): number {
  const a = v1.split(".").map(Number);
  const b = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export function useSilentUpdater() {
  const [isNewVersionDownloaded, setDownloaded] = useState(false);
  const [installerPath, setInstallerPath] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(updateJsonUrl, {
          method: "GET",
          responseType: ResponseType.JSON,
        });
        console.log("[Updater] 更新检查结果:", res);
        const remote = (await res.data) as VersionInfo;

        const currentVersion = await app.getVersion();
        console.log("[Updater] 当前版本:", currentVersion);
        console.log("[Updater] 最新版本:", remote.version);
        if (compareVersions(remote.version, currentVersion) <= 0) return;
        const currentPlatform = await getPlatformKey();
        const platformInfo = remote.platforms[currentPlatform];

        if (!platformInfo?.url) {
          console.warn("当前平台无对应更新文件，跳过更新。");
          return;
        }
        const fileName = `AidenChat-v${remote.version}.app.zip`;
        const filePath = await join(useDataDir, fileName);
        console.log("[Updater] 下载路径:", filePath);
        const fileAlreadyExists = await exists(filePath);
        console.log("[Updater] 文件是否已存在:", fileAlreadyExists);

        if (fileAlreadyExists) {
          setDownloaded(true);
          setInstallerPath(filePath);
          return;
        }

        // 静默下载
        console.log("[Updater] 开始下载更新:", platformInfo.url);
        const fileRes = await fetch(platformInfo.url);
        await writeBinaryFile({
          contents: new Uint8Array(fileRes.data as number[]),
          path: filePath,
        });
        console.log("[Updater] 下载完成:", filePath);

        setDownloaded(true);
        setInstallerPath(filePath);
      } catch (e) {
        console.error("[Updater] 更新检查或下载失败:", e);
      }
    })();
  }, []);

  const installApp = useCallback(async () => {
    if (!installerPath) return;
    try {
      console.log("[Updater] 开始安装:", installerPath);
      await shell.open(installerPath);
      await removeFile(installerPath);
      await relaunch();
    } catch (e) {
      console.error("[Updater] 安装失败:", e);
    }
  }, [installerPath]);

  return {
    isNewVersionDownloaded,
    installApp,
  };
}
