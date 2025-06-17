#!/bin/bash
set -e

ARCH=$1

if [ -z "$ARCH" ]; then
  echo "❌ 错误：未传入架构参数 (arm64 或 x86_64)"
  exit 1
fi

# 创建 bin 目录
mkdir -p src-tauri/bin

# === 下载 host_server ===
echo "🟡 获取 host_server 下载链接..."
if [ "$ARCH" == "arm64" ]; then
  ASSET_NAME="host_server_macos"
else
  ASSET_NAME="host_server_macos_x86_64"
fi

ASSET_FILE="$ASSET_NAME.zip"
UNPACKED_DIR="host_server_macos"
REPO_OWNER="AllWiseAI"
REPO_NAME="host-server-py"
RELEASE_TAG=$(cat .host_server_version)

# 获取 release 信息
echo "📦 获取 GitHub Release 信息..."
RELEASE_INFO=$(curl -s -H "Authorization: token ${GH_TOKEN}" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$RELEASE_TAG")

# 提取下载链接
DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r ".assets[] | select(.name == \"$ASSET_FILE\") | .url")

if [ -z "$DOWNLOAD_URL" ]; then
  echo "❌ 错误: 未找到下载链接 $ASSET_FILE"
  exit 1
fi
echo "🔗 下载链接: $DOWNLOAD_URL"

# 下载并解压 host_server
curl -L -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/octet-stream" \
  "$DOWNLOAD_URL" -o src-tauri/resources/$ASSET_FILE

unzip -o src-tauri/resources/$ASSET_FILE -d src-tauri/resources/
chmod +x src-tauri/resources/$UNPACKED_DIR/$UNPACKED_DIR
rm -rf src-tauri/resources/$ASSET_FILE
echo "✅ host_server 已下载并解压为 $UNPACKED_DIR"

# === 下载 uv ===
echo "🟡 正在下载 uv..."
if [ "$ARCH" == "arm64" ]; then
  UV_ARCH="aarch64"
else
  UV_ARCH="x86_64"
fi
curl -L https://github.com/astral-sh/uv/releases/download/0.6.17/uv-${UV_ARCH}-apple-darwin.tar.gz \
  -o src-tauri/bin/uv.tar.gz
tar -xzf src-tauri/bin/uv.tar.gz -C src-tauri/bin --strip-components=1 \
  uv-${UV_ARCH}-apple-darwin/uv uv-${UV_ARCH}-apple-darwin/uvx
chmod +x src-tauri/bin/uv src-tauri/bin/uvx
rm -f src-tauri/bin/uv.tar.gz
echo "✅ uv 已下载并解压"

# === 下载 bun ===
echo "🟡 正在下载 bun..."
if [ "$ARCH" == "arm64" ]; then
  BUN_ARCH="aarch64"
else
  BUN_ARCH="x64"
fi
curl -L https://github.com/oven-sh/bun/releases/download/bun-v1.2.13/bun-darwin-${BUN_ARCH}.zip \
  -o src-tauri/bin/bun.zip
unzip -o src-tauri/bin/bun.zip -d src-tauri/bin/
mv src-tauri/bin/bun-darwin-${BUN_ARCH}/bun src-tauri/bin/bun
chmod +x src-tauri/bin/bun
rm -rf src-tauri/bin/bun-darwin-${BUN_ARCH} src-tauri/bin/bun.zip
echo "✅ bun 已下载并解压"

# 打印最终结构
echo "📂 当前 src-tauri/bin 目录下的文件："
ls -l src-tauri/bin
