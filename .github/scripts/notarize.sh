#!/bin/bash

set -e

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app"
DMG_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" | head -n 1)

echo "🧾 开始 Apple Notarization 公证流程"

echo "🔒 提交 .app 公证"
xcrun notarytool submit "$APP_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

echo "📌 stapling .app"
xcrun stapler staple "$APP_PATH"

if [ -f "$DMG_PATH" ]; then
  echo "🔒 提交 .dmg 公证"
  xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait

  echo "📌 stapling .dmg"
  xcrun stapler staple "$DMG_PATH"
fi

echo "✅ 所有公证已完成并 stapled"
