#!/bin/bash
set -e

ARCH=$1
OS=$2

if [ -z "$ARCH" ] || [ -z "$OS" ]; then
  echo "❌ 错误：未传入架构或系统参数"
  exit 1
fi

# 创建 bin 目录
mkdir -p src-tauri/bin

# === 下载 host_server ===
echo "🟡 获取 host_server 下载链接..."
if [[ "$OS" == "macos-latest" ]]; then
  if [ "$ARCH" == "arm64" ]; then
    ASSET_NAME="host_server_macos"
    UV_ARCH="aarch64"
    BUN_ARCH="aarch64"
    UV_OS="apple-darwin"
    BUN_OS="darwin"
  else
    ASSET_NAME="host_server_macos_x86_64"
    UV_ARCH="x86_64"
    BUN_ARCH="x64"
    UV_OS="apple-darwin"
    BUN_OS="darwin"
  fi
elif [[ "$OS" == "windows-latest" ]]; then
  ASSET_NAME="host_server_windows"
  UV_ARCH="x86_64"
  BUN_ARCH="x64"
  UV_OS="pc-windows-msvc"
  BUN_OS="windows"
else
  echo "❌ 错误：未知系统 $OS"
  exit 1
fi

ASSET_FILE="$ASSET_NAME.zip"
UNPACKED_DIR="$ASSET_NAME"
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
chmod +x src-tauri/resources/$UNPACKED_DIR/$UNPACKED_DIR.exe || true
chmod +x src-tauri/resources/$UNPACKED_DIR/$UNPACKED_DIR || true
rm -rf src-tauri/resources/$ASSET_FILE
echo "✅ host_server 已下载并解压"

# === 下载 uv ===
echo "🟡 正在下载 uv..."
UV_VERSION="0.6.17"

if [[ "$UV_OS" == "apple-darwin" ]]; then
  UV_FILE="uv-${UV_ARCH}-${UV_OS}.tar.gz"
  curl -L "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${UV_FILE}" \
    -o src-tauri/bin/uv.tar.gz
  tar -xzf src-tauri/bin/uv.tar.gz -C src-tauri/bin --strip-components=1 \
    uv-${UV_ARCH}-${UV_OS}/uv uv-${UV_ARCH}-${UV_OS}/uvx
else
  UV_FILE="uv-${UV_ARCH}-${UV_OS}.zip"
  curl -L "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${UV_FILE}" \
    -o src-tauri/bin/uv.zip
  unzip -o src-tauri/bin/uv.zip -d src-tauri/bin/
fi

chmod +x src-tauri/bin/uv* || true
rm -f src-tauri/bin/uv.zip src-tauri/bin/uv.tar.gz
echo "✅ uv 已下载并解压"

# === 下载 bun ===
echo "🟡 正在下载 bun..."
BUN_VERSION="bun-v1.2.13"
if [[ "$BUN_OS" == "darwin" ]]; then
  BUN_FILE="bun-${BUN_OS}-${BUN_ARCH}.zip"
else
  BUN_FILE="bun-${BUN_OS}-${BUN_ARCH}.zip"
fi

curl -L "https://github.com/oven-sh/bun/releases/download/${BUN_VERSION}/${BUN_FILE}" \
  -o src-tauri/bin/bun.zip

unzip -o src-tauri/bin/bun.zip -d src-tauri/bin/
if [[ "$BUN_OS" == "windows" ]]; then
  mv src-tauri/bin/bun-${BUN_OS}-${BUN_ARCH}/bun.exe src-tauri/bin/bun.exe
else
  mv src-tauri/bin/bun-${BUN_OS}-${BUN_ARCH}/bun src-tauri/bin/bun
fi

chmod +x src-tauri/bin/bun* || true
rm -rf src-tauri/bin/bun-${BUN_OS}-${BUN_ARCH} src-tauri/bin/bun.zip
echo "✅ bun 已下载并解压"

# 打印最终结构
echo "📂 当前 src-tauri/bin 目录下的文件："
ls -l src-tauri/bin
