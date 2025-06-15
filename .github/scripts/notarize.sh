#!/bin/bash
set -e

ARCH=$1

# ✅ 架构别名映射：用来修正 Tauri 输出中实际使用的目录命名和文件名
if [[ "$ARCH" == "arm64" ]]; then
  ARCH_DIR="aarch64"
  ARCH_DMG_SUFFIX="aarch64"
elif [[ "$ARCH" == "x86_64" ]]; then
  ARCH_DIR="x86_64"
  ARCH_DMG_SUFFIX="x64"
else
  echo "❌ Invalid arch: $ARCH"
  exit 1
fi

APP_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/macos/AidenChat.app"
ZIP_PATH="${APP_PATH}.zip"
DMG_NAME="AidenChat_${PACKAGE_VERSION}_${ARCH_DMG_SUFFIX}.dmg"
DMG_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/dmg/${DMG_NAME}"
VOL_NAME="AidenChat"
LATEST_JSON_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/macos/latest.json"

echo "🧾 开始 Apple Notarization 公证流程 for $ARCH"

echo "🛡️ 验证签名有效性"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

# 删除旧 zip
rm -f "$ZIP_PATH"

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

# 重新签名 .dmg
echo "🔏 重新签名 .dmg"
codesign --force --sign "$APPLE_SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"

# 公证 .dmg
echo "🚀 提交 .dmg 公证: $DMG_PATH"
xcrun notarytool submit "$DMG_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

echo "📌 stapling .dmg"
xcrun stapler staple "$DMG_PATH"

echo "✅ $ARCH 架构公证完成 ✅"

# 生成 .sig 签名
ASSET_PATH="$ZIP_PATH"
SIG_PATH="${ZIP_PATH}.sig"
echo "$TAURI_PRIVATE_KEY" | base64 -d > tauri_private_key.pem
openssl dgst -sha256 -sign tauri_private_key.pem -out "$SIG_PATH" "$ASSET_PATH"
rm tauri_private_key.pem

SIGNATURE=$(base64 < "$SIG_PATH" | tr -d '\n')
ASSET_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/v${PACKAGE_VERSION}/$(basename "$ZIP_PATH")"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📝 生成 latest.json"
cat > "$LATEST_JSON_PATH" <<EOF
{
  "version": "$PACKAGE_VERSION",
  "notes": "",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-${ARCH}": {
      "signature": "$SIGNATURE",
      "url": "$ASSET_URL"
    }
  }
}
EOF
