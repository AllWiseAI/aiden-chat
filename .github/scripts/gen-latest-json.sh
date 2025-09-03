#!/bin/bash
set -e

VERSION="${PACKAGE_VERSION}"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/${VERSION}"
ARTIFACT_DIR="artifacts"
CRC_TOOL=".github/scripts/crc64.py"

# === 路径设定 ===
SIG_ARM64="${ARTIFACT_DIR}/macos-latest-arm64-artifacts/macos/AidenChat_aarch64.app.tar.gz.sig"
ZIP_ARM64="${ARTIFACT_DIR}/macos-latest-arm64-artifacts/macos/AidenChat_aarch64.app.tar.gz"
DMG_ARM64="${ARTIFACT_DIR}/macos-latest-arm64-artifacts/dmg/AidenChat_${PACKAGE_VERSION}_aarch64_signed.dmg"


SIG_X64="${ARTIFACT_DIR}/macos-latest-x86_64-artifacts/macos/AidenChat_x64.app.tar.gz.sig"
ZIP_X64="${ARTIFACT_DIR}/macos-latest-x86_64-artifacts/macos/AidenChat_x64.app.tar.gz"
DMG_X64="${ARTIFACT_DIR}/macos-latest-x86_64-artifacts/dmg/AidenChat_${PACKAGE_VERSION}_x64_signed.dmg"

SIG_WIN_X64="${ARTIFACT_DIR}/windows-latest-x86_64-artifacts/msi/AidenChat_${PACKAGE_VERSION}_x64_en-US.msi.zip.sig"
ZIP_WIN_X64="${ARTIFACT_DIR}/windows-latest-x86_64-artifacts/msi/AidenChat_${PACKAGE_VERSION}_x64_en-US.msi.zip"
MSI_WIN_X64="${ARTIFACT_DIR}/windows-latest-x86_64-artifacts/msi/AidenChat_${PACKAGE_VERSION}_x64_en-US.msi" 

# === 检查产物是否存在 ===
for f in "$SIG_ARM64" "$ZIP_ARM64" "$SIG_X64" "$ZIP_X64"; do
  if [[ ! -f "$f" ]]; then
    echo "❌ 缺少构建产物: $f"
    exit 1
  fi
done

# === 编码签名 ===
SIGNATURE_ARM64=$(cat "$SIG_ARM64")
SIGNATURE_X64=$(cat "$SIG_X64")
SIGNATURE_WIN_X64=$(cat "$SIG_WIN_X64")

# === CRC64 计算 ===
CRC64_DMG_ARM64=$(python3 "$CRC_TOOL" "$DMG_ARM64")
CRC64_DMG_X64=$(python3 "$CRC_TOOL" "$DMG_X64")
CRC64_MSI_X64=$(python3 "$CRC_TOOL" "$MSI_WIN_X64")

CRC64_ZIP_ARM64=$(python3 "$CRC_TOOL" "$ZIP_ARM64")
CRC64_ZIP_X64=$(python3 "$CRC_TOOL" "$ZIP_X64")
CRC64_ZIP_WIN_X64=$(python3 "$CRC_TOOL" "$ZIP_WIN_X64")

CRC64_SIG_ARM64=$(python3 "$CRC_TOOL" "$SIG_ARM64")
CRC64_SIG_X64=$(python3 "$CRC_TOOL" "$SIG_X64")
CRC64_SIG_WIN_X64=$(python3 "$CRC_TOOL" "$SIG_WIN_X64")


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
      "signature": "$SIGNATURE_WIN_X64",
      "sig_url": "$REPO_URL/$(basename "$SIG_WIN_X64")",
      "sig_crc64": "$CRC64_SIG_WIN_X64",
      "url": "$REPO_URL/$(basename "$ZIP_WIN_X64")",
      "zip_crc64": "$CRC64_ZIP_WIN_X64",
      "installer_url": "$REPO_URL/$(basename "$MSI_WIN_X64")",
      "installer_crc64": "$CRC64_MSI_X64"
    }
  }
}
EOF

echo "✅ latest.json 生成完毕: dist/latest.json"
