#!/bin/bash
set -e

ARCH=$1
SIGN_IDENTITY="${APPLE_SIGN_IDENTITY}"

if [[ "$ARCH" == "arm64" ]]; then
  HOST_ARCH="arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
  HOST_ARCH="x86_64"
else
  echo "❌ Invalid arch: $ARCH (must be 'arm64' or 'x86_64')"
  exit 1
fi

sign_file() {
  FILE="$1"
  if [ -x "$FILE" ]; then
    echo "🔏 Signing $FILE"
    codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$FILE"
  else
    echo "ℹ️ Skipping (not executable): $FILE"
  fi
}

echo "🚀 签名 src-tauri/bin 中的核心二进制..."

BIN_DIR="src-tauri/bin"
for bin in uv uvx bun; do
  BIN_PATH="$BIN_DIR/$bin"
  if [ -f "$BIN_PATH" ]; then
    sign_file "$BIN_PATH"
  else
    echo "❌ 找不到 $BIN_PATH"
  fi
done

echo "🚀 签名 host_server_macos_${HOST_ARCH} 中的可执行文件..."

HOST_DIR="src-tauri/resources/host_server_macos_${HOST_ARCH}"
PY_FRAMEWORK="$HOST_DIR/_internal/Python.framework"
PY_SYMLINK="$PY_FRAMEWORK/Python"

if [ -d "$HOST_DIR" ]; then
  find "$HOST_DIR" -type f \( -perm +111 -o -name "*.dylib" -o -name "*.so" -o -name "*.node" \) \
    ! -path "$PY_FRAMEWORK/*" | while read -r file; do
    sign_file "$file"
  done

  if [ -L "$PY_SYMLINK" ]; then
    echo "🔗 Python.framework/Python 是符号链接，跳过"
  elif [ -f "$PY_SYMLINK" ]; then
    echo "🧹 替换为符号链接: Python.framework/Python"
    rm "$PY_SYMLINK"
    ln -s "Versions/3.13/Python" "$PY_SYMLINK"
  fi

  if [ -d "$PY_FRAMEWORK" ]; then
    find "$PY_FRAMEWORK/Versions" -type f -name "Python" | while read -r bin; do
      sign_file "$bin"
    done
    sign_file "$PY_SYMLINK"
  fi
else
  echo "❌ 没有找到 host_server_macos_${HOST_ARCH} 目录"
fi

echo "✅ 所有构建前资源已签名完成"
