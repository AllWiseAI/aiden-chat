import { useCallback, useEffect, useState } from "react";
import { fetch, ResponseType } from "@tauri-apps/api/http";

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadPath?: string;
}

export function useUpdateChecker(remoteJsonUrl: string) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (typeof window === "undefined") return;
    const { getVersion } = await import("@tauri-apps/api/app");
    const { appDataDir } = await import("@tauri-apps/api/path");
    const { writeFile, exists } = await import("@tauri-apps/api/fs");
    try {
      setChecking(true);
      setError(null);

      const currentVersion = await getVersion();

      const res = await fetch(remoteJsonUrl);
      const { data, status } = res;
      if (status !== 200) {
        throw new Error(`拉取 latest.json 失败: ${status}`);
      }
      const { version, platforms } = data as {
        version: string;
        platforms: Record<string, any>;
      };
      console.log(version, platforms);

      // 获取当前平台信息
      const osPlatform = await import("@tauri-apps/api/os");
      const arch = await osPlatform.arch();
      const platform = await osPlatform.platform();

      // 组合成你的platform key
      const platformKey = `${platform}-${arch}`;
      const platformInfo = platforms[platformKey];
      console.log(platformKey, platformInfo);

      if (!platformInfo) {
        throw new Error(`当前平台 ${platformKey} 不在支持范围`);
      }
      if (version !== currentVersion) {
        // 有更新
        const targetFileName = `${version}.zip`;

        const dir = await appDataDir();
        const targetPath = `${dir}${targetFileName}`;

        // 先检查文件是否已存在
        const alreadyExists = await exists(targetPath);
        console.log("=alreadyExists", alreadyExists);
        if (alreadyExists) {
          console.log(`${targetFileName} 已存在，跳过下载`);
          setUpdateInfo({
            hasUpdate: true,
            currentVersion,
            latestVersion: version,
            downloadPath: `${await appDataDir()}${targetFileName}`,
          });
          return;
        }

        console.log(dir, targetPath);
        const fileResponse = await fetch(
          "https://images.unsplash.com/photo-1750779940698-f24b28d76fd9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNnx8fGVufDB8fHx8fA%3D%3D",
          {
            method: "GET",
            responseType: ResponseType.Binary,
          },
        );
        const data = fileResponse.data as ArrayBuffer;

        await writeFile({
          path: targetPath,
          // @ts-expect-error
          contents: new Uint8Array(data),
        });

        setUpdateInfo({
          hasUpdate: true,
          currentVersion,
          latestVersion: version,
          downloadPath: targetPath,
        });
      } else {
        setUpdateInfo({
          hasUpdate: false,
          currentVersion,
          latestVersion: version,
        });
      }
    } catch (err: any) {
      console.error("checkForUpdate error", err);
      setError(err.message || String(err));
    } finally {
      setChecking(false);
    }
  }, [remoteJsonUrl]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    updateInfo,
    checking,
    error,
    reload: checkForUpdate,
  };
}
