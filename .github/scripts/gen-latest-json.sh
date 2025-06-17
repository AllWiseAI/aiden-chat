#!/bin/bash
set -e

VERSION="${PACKAGE_VERSION}"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_URL="https://github.com/AllWiseAI/aiden-chat/releases/download/v${VERSION}"
ARTIFACT_DIR="artifacts"

# === 路径设定 ===
SIG_ARM64="${ARTIFACT_DIR}/aarch64-artifacts/AidenChat_aarch64.app.zip.sig"
ZIP_ARM64="${ARTIFACT_DIR}/aarch64-artifacts/AidenChat_aarch64.app.zip"

SIG_X64="${ARTIFACT_DIR}/x64-artifacts/AidenChat_x64.app.zip.sig"
ZIP_X64="${ARTIFACT_DIR}/x64-artifacts/AidenChat_x64.app.zip"

# === 检查产物是否存在 ===
for f in "$SIG_ARM64" "$ZIP_ARM64" "$SIG_X64" "$ZIP_X64"; do
  if [[ ! -f "$f" ]]; then
    echo "❌ 缺少构建产物: $f"
    exit 1
  fi
done

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
