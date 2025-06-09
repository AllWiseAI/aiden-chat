#!/bin/bash

set -e
echo "🧾 开始上传文件到release"


# 清理tauri build之前的文件
echo "🧹 清理tauri build之前的文件"
rm -rf src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app.tar.gz
rm -rf src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app.tar.gz.sig
rm -rf src-tauri/target/universal-apple-darwin/release/bundle/dmg/AidenChat_${PACKAGE_VERSION}_universal.dmg

# 检查指定目录准备开始上传
echo "📂 检查指定目录准备开始上传"
ls -l src-tauri/target/universal-apple-darwin/release/bundle/macos/
ls -l src-tauri/target/universal-apple-darwin/release/bundle/dmg/

# 上传到 GitHub Releases
echo "📤 上传到 GitHub Releases"
gh release upload "v${LATEST_TAG}" \
  src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app.zip \
  src-tauri/target/universal-apple-darwin/release/bundle/macos/AidenChat.app.zip.sig \
  src-tauri/target/universal-apple-darwin/release/bundle/macos/latest.json\
  src-tauri/target/universal-apple-darwin/release/bundle/dmg/AidenChat_${PACKAGE_VERSION}_universal_signed.dmg


