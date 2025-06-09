#!/bin/bash
set -e

# 创建 bin 目录
mkdir -p src-tauri/bin

# === 下载 host_server ===
echo "正在获取 host_server 下载链接..."
ASSET_NAME="host_server_macos"
ASSET_FILE="$ASSET_NAME.zip"
REPO_OWNER="AllWiseAI"
REPO_NAME="host-server-py"
RELEASE_TAG=$(cat .host_server_version)

# 获取 release 信息
echo "Fetching release info from GitHub API..."
RELEASE_INFO=$(curl -s -H "Authorization: token ${GH_TOKEN}" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$RELEASE_TAG")

# 提取下载链接
DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r ".assets[] | select(.name == \"$ASSET_FILE\") | .url")

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Error: Download URL not found for $ASSET_FILE"
  exit 1
else
  echo "Download URL: $DOWNLOAD_URL"
fi

# 下载并解压 host_server
curl -L -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/octet-stream" "$DOWNLOAD_URL" -o src-tauri/resources/$ASSET_FILE
unzip src-tauri/resources/$ASSET_FILE -d src-tauri/resources/
chmod +x src-tauri/resources/$ASSET_NAME/$ASSET_NAME
rm -rf src-tauri/resources/$ASSET_FILE
echo "✅ host_server 已成功下载并解压"

# === 下载 uv ===
echo "正在下载 uv..."
curl -L https://github.com/astral-sh/uv/releases/download/0.6.17/uv-aarch64-apple-darwin.tar.gz -o src-tauri/bin/uv.tar.gz
tar -xzf src-tauri/bin/uv.tar.gz -C src-tauri/bin --strip-components=1 uv-aarch64-apple-darwin/uv uv-aarch64-apple-darwin/uvx
chmod +x src-tauri/bin/uv src-tauri/bin/uvx
rm -f src-tauri/bin/uv.tar.gz
echo "✅ uv 已下载并解压"

# === 下载 bun ===
echo "正在下载 bun..."
curl -L https://github.com/oven-sh/bun/releases/download/bun-v1.2.13/bun-darwin-aarch64.zip -o src-tauri/bin/bun.zip
unzip -o src-tauri/bin/bun.zip -d src-tauri/bin/
mv src-tauri/bin/bun-darwin-aarch64/bun src-tauri/bin/bun
chmod +x src-tauri/bin/bun
rm -rf src-tauri/bin/bun-darwin-aarch64 src-tauri/bin/bun.zip
echo "✅ bun 已下载并解压"

# 打印结果
echo "📂 当前 src-tauri/bin 目录下的文件："
ls -l src-tauri/bin
