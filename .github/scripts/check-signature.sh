#!/bin/bash
set -e

ARCH=$1

if [[ "$ARCH" != "arm64" && "$ARCH" != "x86_64" ]]; then
  echo "❌ Invalid arch: $ARCH (must be 'arm64' or 'x86_64')"
  exit 1
fi

APP_PATH="src-tauri/target/${ARCH}-apple-darwin/release/bundle/macos/AidenChat.app"
SIGN_IDENTITY="${APPLE_SIGN_IDENTITY}"

echo "🔍 正在检查 $ARCH 架构下 .app 中的签名状态..."

if [ ! -d "$APP_PATH" ]; then
  echo "❌ 找不到 app 路径：$APP_PATH"
  exit 1
fi

# 查找所有 Mach-O 文件（可执行文件、动态库、.so、.dylib、.node 等）
find "$APP_PATH" -type f | while read -r file; do
  if file "$file" | grep -qE "Mach-O"; then
    if codesign -dvvv "$file" 2>&1 | grep -q "Authority="; then
      echo "✅ 已签名: $file"
    else
      echo "❌ 未签名: $file"
    fi
  fi
done
