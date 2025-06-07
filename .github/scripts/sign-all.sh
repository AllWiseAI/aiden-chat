#!/bin/bash

set -e

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app"
BIN_DIR="$APP_PATH/Contents/Resources/bin"
RESOURCES_DIR="$APP_PATH/Contents/Resources/resources"
DMG_DIR="src-tauri/target/universal-apple-darwin/release/bundle/dmg"
SIGN_IDENTITY="${APPLE_SIGN_IDENTITY}"

sign_file() {
  FILE="$1"
  if [ -x "$FILE" ]; then
    echo "🔏 Signing $FILE"
    codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$FILE"
  else
    echo "ℹ️ Skipping (not executable): $FILE"
  fi
}

# 1. 签名 bin 目录下的二进制
for f in "$BIN_DIR"/*; do
  sign_file "$f"
done

# 2. 签名 resources 下的 host_server_macos
for f in "$RESOURCES_DIR"/*; do
  sign_file "$f"
done

# 3. 签名完整的 .app
echo "🔏 Signing entire app bundle..."
codesign --deep --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$APP_PATH"

# 4. 可选：签名 dmg
DMG_PATH=$(find "$DMG_DIR" -name "*.dmg" | head -n 1)
if [ -f "$DMG_PATH" ]; then
  echo "🔏 Signing DMG: $DMG_PATH"
  codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"
fi

echo "✅ 所有签名已完成。"
