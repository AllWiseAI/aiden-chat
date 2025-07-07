#!/bin/bash
set -e

ARCH=$1

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
ZIP_NAME="AidenChat_${ARCH_DMG_SUFFIX}.app.zip"
ZIP_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/macos/${ZIP_NAME}"
DMG_NAME="AidenChat_${PACKAGE_VERSION}_${ARCH_DMG_SUFFIX}_signed.dmg"
DMG_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/dmg/${DMG_NAME}"
VOL_NAME="AidenChat"

echo "🧾 开始 Apple Notarization 公证流程 for $ARCH"

echo "🛡️ 验证签名有效性"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

# 删除旧 zip
rm -f "$ZIP_PATH"

# 用 zip -r 重新打包，保证 Tauri zip-rs 能解压
echo "📦 使用 zip -r 打包 .app 为 .zip（兼容 Tauri 解压）"
cd "$(dirname "$APP_PATH")"
zip -r "$ZIP_PATH" "$(basename "$APP_PATH")"
cd -

# 公证 zip
echo "🚀 提交 .zip 公证"
xcrun notarytool submit "$ZIP_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# stapler 附加票据
echo "📌 stapling .app"
xcrun stapler staple "$APP_PATH"

# 重新打 DMG
echo "💿 重新打包 .dmg"
mkdir -p dmg_temp
cp -R "$APP_PATH" dmg_temp/
ln -s /Applications "dmg_temp/Applications"
hdiutil create -volname "$VOL_NAME" -srcfolder dmg_temp -fs HFS+ -format UDZO "$DMG_PATH"
rm -rf dmg_temp

# unlock keychain
echo "🔐 解锁 keychain"
KEYCHAIN_PASSWORD="build_password"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" build.keychain

# 重新签名 .dmg
echo "🔏 重新签名 .dmg"
codesign --force --sign "$APPLE_SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"

# 公证 dmg
echo "🚀 提交 .dmg 公证"
xcrun notarytool submit "$DMG_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

echo "📌 stapling .dmg"
xcrun stapler staple "$DMG_PATH"

echo "✅ $ARCH 架构公证完成 ✅"

# 生成签名
echo "🔏 tauri signer sign zip"
npx tauri signer sign \
  --password "$TAURI_KEY_PASSWORD" \
  --private-key "$TAURI_PRIVATE_KEY" \
  "$ZIP_PATH"

echo "✅ 最终产物:"
echo "  ZIP: $ZIP_PATH"
echo "  SIG: ${ZIP_PATH}.sig"
echo "  DMG: $DMG_PATH"
