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

sign_host_server() {
  HOST_DIR="$RESOURCES_DIR/host_server_macos"

  if [ -d "$HOST_DIR" ]; then
    echo "🔍 Recursively signing host_server_macos contents in $HOST_DIR..."

    # 1. 检测 Python.framework 是否存在
    PY_FRAMEWORK="$HOST_DIR/_internal/Python.framework"
    PY_EXEC="$PY_FRAMEWORK/Versions/Current/Python"
    PY_SYMLINK="$PY_FRAMEWORK/Python"
    # 解析 real binary 路径（避免只签名 symlink）
    REAL_PY_EXEC=$(realpath "$PY_EXEC")

    # 2. 先递归签名其他可执行文件，但排除 framework 下的文件
    find "$HOST_DIR" -type f \( \
      -perm +111 -o -name "*.dylib" -o -name "*.so" -o -name "*.node" \
    \) ! -path "$PY_FRAMEWORK/*" | while read -r FILE; do
      sign_file "$FILE"
    done

    # 3. 单独签名 Python.framework
    if [ -d "$PY_FRAMEWORK" ]; then
      echo "🔏 Found Python.framework, starting proper signing flow..."

      if [ -f "$REAL_PY_EXEC" ]; then
        echo "🔏 Signing framework binary: $REAL_PY_EXEC"
        codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$REAL_PY_EXEC"
      else
        echo "⚠️ Python executable not found in framework: $REAL_PY_EXEC"
      fi
    fi
    
    if [ -L "$PY_SYMLINK" ]; then
      echo "🔏 Signing Python.framework symlink path: $PY_SYMLINK"
      codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$PY_SYMLINK"
    fi

    echo "✅ Finished signing host_server_macos contents."
  else
    echo "⚠️ host_server_macos directory not found at $HOST_DIR"
  fi
}

# 1. 签名 bin 目录下的二进制
for f in "$BIN_DIR"/*; do
  sign_file "$f"
done

# 2. 签名 resources 下的可执行文件（包括 host_server_macos 主体）
for f in "$RESOURCES_DIR"/*; do
  sign_file "$f"
done

# 2.1 签名 host_server_macos 子内容（.so / .dylib / .node / 子可执行文件等）
sign_host_server

# 3. 签名完整的 .app
echo "🔏 Signing entire app bundle..."
codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$APP_PATH"

# 4. 可选：签名 dmg
DMG_PATH=$(find "$DMG_DIR" -name "*.dmg" | head -n 1)
if [ -f "$DMG_PATH" ]; then
  echo "🔏 Signing DMG: $DMG_PATH"
  codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"
fi

echo "✅ 所有签名已完成。"
