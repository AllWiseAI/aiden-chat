#!/bin/bash

set -e

APP_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app"
ZIP_PATH="${APP_PATH}.zip"
# DMG_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" | head -n 1)
DMG_NAME="AidenChat_${PACKAGE_VERSION}_universal_signed.dmg"
DMG_PATH="src-tauri/target/universal-apple-darwin/release/bundle/dmg/${DMG_NAME}"
VOL_NAME="AidenChat"

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

# 重新创建 .dmg（使用已公证 .app）
echo "💿 重新打包 .dmg"
mkdir -p dmg_temp
cp -R "$APP_PATH" dmg_temp/
ln -s /Applications "dmg_temp/Applications"
hdiutil create -volname "$VOL_NAME" -srcfolder dmg_temp -fs HFS+ -format UDZO "$DMG_PATH"
rm -rf dmg_temp

# re-unlock
KEYCHAIN_PASSWORD="build_password"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" build.keychain

# 签名 .dmg
echo "🔏 重新签名 .dmg"
codesign --force --sign "$APPLE_SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"

# 提交公证 .dmg
echo "🚀 提交 .dmg 公证: $DMG_PATH"
xcrun notarytool submit "$DMG_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# stapler .dmg
echo "📌 stapling .dmg"
xcrun stapler staple "$DMG_PATH"

echo "✅ 所有公证任务完成并已 stapled ✅"

# 创建 sig 文件
echo "📝 使用 tauri sign 创建 sig 文件"

# 设置输入输出路径
ASSET_PATH="$ZIP_PATH"
SIG_PATH="${ZIP_PATH}.sig"

# 使用 tauri sign 进行签名
npx tauri sign \
  --input "$ASSET_PATH" \
  --output "$SIG_PATH" \
  ${TAURI_KEY_PASSWORD:+--password "$TAURI_KEY_PASSWORD"}

echo "✅ 签名完成: $SIG_PATH"

# 生成latest.json
echo "📝 生成latest.json"
LATEST_JSON_PATH="src-tauri/target/universal-apple-darwin/release/bundle/macos/latest.json"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SIGNATURE=$(base64 < "${ZIP_PATH}.sig" | tr -d '\n')
ASSET_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/v${PACKAGE_VERSION}/$(basename "$ZIP_PATH")"

echo "📝 生成 latest.json"
cat > "$LATEST_JSON_PATH" <<EOF
{
  "version": "$PACKAGE_VERSION",
  "notes": "",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIGNATURE",
      "url": "$ASSET_URL"
    },
    "darwin-x86_64": {
      "signature": "$SIGNATURE",
      "url": "$ASSET_URL"
    }
  }
}
EOF
