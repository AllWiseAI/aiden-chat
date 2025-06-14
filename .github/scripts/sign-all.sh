#!/bin/bash
set -e

ARCH=$1

if [[ "$ARCH" != "arm64" && "$ARCH" != "x86_64" ]]; then
  echo "❌ Invalid arch: $ARCH (must be 'arm64' or 'x86_64')"
  exit 1
fi

APP_PATH="src-tauri/target/${ARCH}-apple-darwin/release/bundle/macos/AidenChat.app"
BIN_DIR="$APP_PATH/Contents/Resources/bin"
RESOURCES_DIR="$APP_PATH/Contents/Resources/resources"
DMG_DIR="src-tauri/target/${ARCH}-apple-darwin/release/bundle/dmg"
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
  PY_SYMLINK="$PY_FRAMEWORK/Python"

  if [ -d "$HOST_DIR" ]; then
    echo "🔍 Signing host_server_macos in $HOST_DIR..."

    find "$HOST_DIR" -type f \( -perm +111 -o -name "*.dylib" -o -name "*.so" -o -name "*.node" \) \
      ! -path "$PY_FRAMEWORK/*" | while read -r FILE; do
      echo "🔏 Signing binary: $FILE"
      codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=2 "$FILE"
    done

    if [ -L "$PY_SYMLINK" ]; then
      echo "🔗 Python.framework/Python is a symlink (expected)"
    elif [ -f "$PY_SYMLINK" ]; then
      echo "🧹 Removing non-symlink Python.framework/Python and restoring symlink"
      rm "$PY_SYMLINK"
      ln -s "Versions/3.13/Python" "$PY_SYMLINK"
    fi

    if [ -d "$PY_FRAMEWORK" ]; then
      echo "🔍 Found Python.framework, signing all relevant binaries..."
      find "$PY_FRAMEWORK/Versions" -type f -name "Python" | while read -r PY_BIN; do
        echo "🔏 Signing real Python binary: $PY_BIN"
        codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$PY_BIN"
      done

      echo "🔏 Signing top-level: $PY_SYMLINK"
      codesign --force --deep --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=2 "$PY_SYMLINK"
    fi
  fi
}

# 1. 签名 bin 目录下的二进制
if [ -d "$BIN_DIR" ]; then
  for f in "$BIN_DIR"/*; do
    sign_file "$f"
  done
fi

# 2. 签名 resources 下的可执行文件
if [ -d "$RESOURCES_DIR" ]; then
  for f in "$RESOURCES_DIR"/*; do
    sign_file "$f"
  done
fi

# 2.1 host_server 子内容签名
sign_host_server

# 3. 签名 .app
if [ -d "$APP_PATH" ]; then
  echo "🔏 Signing entire app bundle for $ARCH..."
  codesign --force --deep --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$APP_PATH"
fi

# 4. 签名 dmg
DMG_PATH=$(find "$DMG_DIR" -name "*.dmg" | head -n 1)
if [ -f "$DMG_PATH" ]; then
  echo "🔏 Signing DMG: $DMG_PATH"
  codesign --force --options runtime --sign "$SIGN_IDENTITY" --timestamp --verbose=4 "$DMG_PATH"
fi

echo "✅ 所有 $ARCH 架构的签名已完成。"
