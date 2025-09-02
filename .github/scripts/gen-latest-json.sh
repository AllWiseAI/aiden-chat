#!/bin/bash
set -e

VERSION="${PACKAGE_VERSION}"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/${VERSION}"
ARTIFACT_DIR="artifacts"
CRC_TOOL=".github/scripts/crc64.py"

# === 自动查找文件 ===
find_artifact() {
  pattern="$1"
  file=$(find "$ARTIFACT_DIR" -name "$pattern" | head -n 1)
  if [[ ! -f "$file" ]]; then
    echo "❌ 找不到构建产物: $pattern"
    exit 1
  fi
  echo "$file"
}

# macOS
ZIP_ARM64=$(find_artifact "AidenChat_aarch64.app.tar.gz")
SIG_ARM64=$(find_artifact "AidenChat_aarch64.app.tar.gz.sig")
DMG_ARM64=$(find_artifact "AidenChat_*_aarch64_signed.dmg")

ZIP_X64=$(find_artifact "AidenChat_x64.app.tar.gz")
SIG_X64=$(find_artifact "AidenChat_x64.app.tar.gz.sig")
DMG_X64=$(find_artifact "AidenChat_*_x64_signed.dmg")

# Windows
MSI_X64=$(find_artifact "AidenChat_*_x64.msi")
SIG_MSI_X64=$(find_artifact "AidenChat_*_x64.msi.sig")

# === 编码签名 ===
SIGNATURE_ARM64=$(cat "$SIG_ARM64")
SIGNATURE_X64=$(cat "$SIG_X64")
SIGNATURE_MSI_X64=$(cat "$SIG_MSI_X64")

# === CRC64 计算 ===
CRC64_DMG_ARM64=$(python3 "$CRC_TOOL" "$DMG_ARM64")
CRC64_DMG_X64=$(python3 "$CRC_TOOL" "$DMG_X64")
CRC64_ZIP_ARM64=$(python3 "$CRC_TOOL" "$ZIP_ARM64")
CRC64_ZIP_X64=$(python3 "$CRC_TOOL" "$ZIP_X64")
CRC64_SIG_ARM64=$(python3 "$CRC_TOOL" "$SIG_ARM64")
CRC64_SIG_X64=$(python3 "$CRC_TOOL" "$SIG_X64")
CRC64_MSI_X64=$(python3 "$CRC_TOOL" "$MSI_X64")
CRC64_SIG_MSI_X64=$(python3 "$CRC_TOOL" "$SIG_MSI_X64")

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
      "url": "$REPO_URL/$(basename "$ZIP_ARM64")",
      "sig_url": "$REPO_URL/$(basename "$SIG_ARM64")",
      "sig_crc64": "$CRC64_SIG_ARM64",
      "zip_crc64": "$CRC64_ZIP_ARM64",
      "installer_url": "$REPO_URL/$(basename "$DMG_ARM64")",
      "installer_crc64": "$CRC64_DMG_ARM64"
    },
    "darwin-x86_64": {
      "signature": "$SIGNATURE_X64",
      "sig_url": "$REPO_URL/$(basename "$SIG_X64")",
      "sig_crc64": "$CRC64_SIG_X64",
      "url": "$REPO_URL/$(basename "$ZIP_X64")",
      "zip_crc64": "$CRC64_ZIP_X64",
      "installer_url": "$REPO_URL/$(basename "$DMG_X64")",
      "installer_crc64": "$CRC64_DMG_X64"
    },
    "windows-x86_64": {
      "signature": "$SIGNATURE_MSI_X64",
      "url": "$REPO_URL/$(basename "$MSI_X64")",
      "sig_url": "$REPO_URL/$(basename "$SIG_MSI_X64")",
      "zip_crc64": "$CRC64_MSI_X64",
      "sig_crc64": "$CRC64_SIG_MSI_X64"
    }
  }
}
EOF

echo "✅ latest.json 生成完毕: dist/latest.json"
