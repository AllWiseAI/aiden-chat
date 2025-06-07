#!/bin/bash

set -e

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app"
SIGN_IDENTITY="${APPLE_SIGN_IDENTITY}"

echo "🔍 检查 .app 中的未签名文件"

# 查找所有 Mach-O 文件（即可执行文件或动态库）
find "$APP_PATH" -type f | while read -r file; do
  # 判断是否为 Mach-O 文件（非文本/图片等）
  if file "$file" | grep -qE "Mach-O"; then
    if codesign -dvvv "$file" 2>&1 | grep -q "Authority="; then
      echo "✅ 已签名: $file"
    else
      echo "❌ 未签名: $file"
    fi
  fi
done
