#!/bin/bash

set -e

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app"
ZIP_PATH="${APP_PATH}.zip"
DMG_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" | head -n 1)

echo "🧾 开始 Apple Notarization 公证流程"

echo "🛡️ 验证签名有效性"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

# 删除旧 zip
if [ -f "$ZIP_PATH" ]; then
  echo "🧹 删除旧 zip 文件: $ZIP_PATH"
  rm "$ZIP_PATH"
fi

# 正确压缩 .app 为 zip（保留签名）
echo "📦 使用 ditto 压缩 .app 为 .zip"
ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

# 提交 zip 公证
echo "🚀 提交 .zip 公证"
xcrun notarytool submit "$ZIP_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# stapler 附加公证票据
echo "📌 stapling .app"
xcrun stapler staple "$APP_PATH"

# 如果有 DMG，重复公证流程
if [ -f "$DMG_PATH" ]; then
  echo "🚀 提交 .dmg 公证: $DMG_PATH"
  xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait

  echo "📌 stapling .dmg"
  xcrun stapler staple "$DMG_PATH"
else
  echo "⚠️ 未找到 .dmg 文件，跳过 .dmg 公证"
fi

echo "✅ 所有公证任务完成并已 stapled ✅"
