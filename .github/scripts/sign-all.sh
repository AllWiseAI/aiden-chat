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
  PY_FRAMEWORK="$HOST_DIR/_internal/Python.framework"
  SIGN_IDENTITY="${APPLE_SIGN_IDENTITY}"

  if [ -d "$HOST_DIR" ]; then
    echo "🔍 Signing host_server_macos in $HOST_DIR..."

    # 🧩 Step 1: 签除 Python.framework 外的所有可执行二进制、.dylib、.so、.node 文件
    find "$HOST_DIR" -type f \( -perm +111 -o -name "*.dylib" -o -name "*.so" -o -name "*.node" \) \
      ! -path "$PY_FRAMEWORK/*" | while read -r FILE; do
      echo "🔏 Signing binary: $FILE"
      codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=2 "$FILE"
    done

    # 🧩 Step 2: 签 Python.framework 中所有实际 Python 可执行文件
    if [ -d "$PY_FRAMEWORK" ]; then
      echo "🔍 Found Python.framework, signing all relevant binaries..."

      # 签名 Versions 目录下的所有真实 Python 二进制
      find "$PY_FRAMEWORK/Versions" -type f -name "Python" | while read -r PY_BIN; do
        echo "🔏 Signing real Python binary: $PY_BIN"
        codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$PY_BIN"
      done

      # # 签名 Python.framework/Python 顶层符号链接
      # PY_SYMLINK="$PY_FRAMEWORK/Python"
      # if [ -f "$PY_SYMLINK" ]; then
      #   echo "🔏 Signing Python.framework symlink: $PY_SYMLINK"
      #   codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$PY_SYMLINK"
      # fi

      # # 最后签名整个 framework
      # echo "🔏 Signing entire framework bundle: $PY_FRAMEWORK"
      # codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=2 "$PY_FRAMEWORK"
    fi

    echo "✅ Finished signing host_server_macos."
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
