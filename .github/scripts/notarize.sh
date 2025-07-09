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
ZIP_PATH="${APP_PATH}.zip"
TAURI_RAW_ZIP_PATH="${APP_PATH}.tar.gz"
TAURI_SIGN_ZIP_NAME="AidenChat_${ARCH_DMG_SUFFIX}.app.tar.gz"
DMG_NAME="AidenChat_${PACKAGE_VERSION}_${ARCH_DMG_SUFFIX}_signed.dmg"
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

# unlock keychain
echo "🔐 解锁 keychain"
KEYCHAIN_PASSWORD="build_password"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" build.keychain

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

# 应用内部更新使用
RENAMED_ZIP_PATH="src-tauri/target/${ARCH_DIR}-apple-darwin/release/bundle/macos/$TAURI_SIGN_ZIP_NAME"
mv "$TAURI_RAW_ZIP_PATH" "$RENAMED_ZIP_PATH"

# 使用 tauri signer
npx tauri signer sign \
  --password "$TAURI_KEY_PASSWORD" \
  --private-key "$TAURI_PRIVATE_KEY"\
  "$RENAMED_ZIP_PATH" \

echo "📦 重命名产物为:"
echo "  ZIP: $RENAMED_ZIP_PATH"
echo "  SIG: $RENAMED_SIG_PATH"
