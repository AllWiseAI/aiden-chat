#!/bin/bash
set -e

VERSION="${PACKAGE_VERSION}"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/v${VERSION}"

# === 路径设定 ===
SIG_ARM64="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/AidenChat_aarch64.app.zip.sig"
ZIP_ARM64="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/AidenChat_aarch64.app.zip"

SIG_X64="src-tauri/target/x86_64-apple-darwin/release/bundle/macos/AidenChat_x64.app.zip.sig"
ZIP_X64="src-tauri/target/x86_64-apple-darwin/release/bundle/macos/AidenChat_x64.app.zip"

# === 编码签名 ===
SIGNATURE_ARM64=$(base64 < "$SIG_ARM64" | tr -d '\n')
SIGNATURE_X64=$(base64 < "$SIG_X64" | tr -d '\n')

# === 构建 latest.json ===
echo "📝 生成合并版 latest.json..."

mkdir -p dist
cat > dist/latest.json <<EOF
{
  "version": "$VERSION",
  "notes": "",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIGNATURE_ARM64",
      "url": "$REPO_URL/$(basename "$ZIP_ARM64")"
    },
    "darwin-x86_64": {
      "signature": "$SIGNATURE_X64",
      "url": "$REPO_URL/$(basename "$ZIP_X64")"
    }
  }
}
EOF

echo "✅ latest.json 生成完毕: dist/latest.json"
