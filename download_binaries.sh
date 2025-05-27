#!/bin/bash

# 脚本开始提示
echo "=============================="
echo "开始下载二进制文件..."
echo "=============================="

# 检查 bin 目录是否存在，如果不存在则创建它
if [ ! -d "src-tauri/bin" ]; then
    echo "bin 目录不存在，正在创建..."
    mkdir -p src-tauri/bin
    if [ $? -eq 0 ]; then
        echo "bin 目录创建成功！"
    else
        echo "bin 目录创建失败！" >&2
        exit 1
    fi
else
    echo "bin 目录已存在，跳过创建。"
fi

# 检查是否安装了 jq
if ! command -v jq &> /dev/null
then
  echo "jq 未安装，正在通过 Homebrew 安装..."
  # 如果没有安装 jq，尝试通过 Homebrew 安装它
  if command -v brew &> /dev/null
  then
    brew install jq
  else
    echo "无法找到 Homebrew。请手动安装 jq 或 Homebrew。" >&2
    exit 1
  fi
fi

# 从环境变量中读取 GitHub 个人访问令牌
export $(cat .env | xargs)

GITHUB_TOKEN="${GITHUB_TOKEN}"
PROXY_URL="http://127.0.0.1:7897"


# 检查 GITHUB_TOKEN 是否存在
if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN 环境变量未设置！请设置访问令牌。"
  exit 1
fi

OWNER="AllWiseAI"
REPO="host-server-py"
RELEASE_TAG=$(cat .host_server_version)
ASSET_NAME="host_server_macos" # test for macos
ASSET_FILE="$ASSET_NAME.zip"

# 获取 release 资产的 ID
echo "获取 release 资产 ID..."
echo "地址为：https://api.github.com/repos/$OWNER/$REPO/releases/tags/$RELEASE_TAG"
RESPONSE=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/releases/tags/$RELEASE_TAG")


# 使用 jq 从 assets 数组中提取指定的 asset 的下载 URL
ASSET_DOWNLOAD_URL=$(echo "$RESPONSE" | jq -r ".assets[] | select(.name == \"$ASSET_FILE\") | .url")

# 如果没有找到下载链接，退出
if [ -z "$ASSET_DOWNLOAD_URL" ]; then
  echo "无法找到名为 '$ASSET_FILE' 的资产！" >&2
  exit 1
fi

# 下载资产
echo "正在下载 $ASSET_FILE..."
echo "下载地址 $ASSET_DOWNLOAD_URL"

curl -L -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/octet-stream" -x ${PROXY_URL} -o "src-tauri/resources/$ASSET_FILE" "$ASSET_DOWNLOAD_URL"

if [ $? -eq 0 ]; then
  echo "$ASSET_FILE 下载完成！"
else
  echo "$ASSET_FILE 下载失败！" >&2
  exit 1
fi

rm -rf "src-tauri/resources/$ASSET_NAME"

# 解压 uv.tar.gz 文件，并提取 uv 文件
echo "正在解压 $ASSET_FILE ..."
unzip src-tauri/resources/$ASSET_FILE -d src-tauri/resources/
if [ $? -eq 0 ]; then
    echo "$ASSET_FILE 解压完成！"
else
    echo "$ASSET_FILE 解压失败！" >&2
    exit 1
fi

echo "拷贝 $ASSET_NAME 到 node_modules目录，用于本地调试 "
rm -rf node_modules/$ASSET_NAME
cp -r src-tauri/resources/$ASSET_NAME node_modules/$ASSET_NAME

rm src-tauri/resources/$ASSET_FILE
echo "已删除 $ASSET_FILE 文件。"

# 下载 uv 二进制文件
echo "正在下载 uv 二进制文件..."
curl -L https://github.com/astral-sh/uv/releases/download/0.6.17/uv-aarch64-apple-darwin.tar.gz -x ${PROXY_URL} -o src-tauri/bin/uv.tar.gz
if [ $? -eq 0 ]; then
    echo "uv 下载完成！"
else
    echo "uv 下载失败！" >&2
    exit 1
fi

# 解压 uv.tar.gz 文件，并提取 uv 文件
echo "正在解压 uv.tar.gz 文件..."
tar -xzf src-tauri/bin/uv.tar.gz -C src-tauri/bin
if [ $? -eq 0 ]; then
    echo "uv 解压完成！"
else
    echo "uv 解压失败！" >&2
    exit 1
fi

# 删除 uv.tar.gz 文件
rm src-tauri/bin/uv.tar.gz
echo "已删除 uv.tar.gz 文件。"

# 只将 uv 文件移到 bin 目录
echo "正在将 uv 文件复制到 bin 目录..."
mv src-tauri/bin/uv-aarch64-apple-darwin/uv src-tauri/bin/uv
mv src-tauri/bin/uv-aarch64-apple-darwin/uvx src-tauri/bin/uvx
if [ $? -eq 0 ]; then
    echo "uv 文件已成功复制到 bin 目录！"
else
    echo "uv 文件复制失败！" >&2
    exit 1
fi

# 删除 uv-aarch64-apple-darwin 目录
rm -rf src-tauri/bin/uv-aarch64-apple-darwin
echo "已删除 uv-aarch64-apple-darwin 目录。"

# 设置可执行权限
echo "正在设置文件的可执行权限..."
chmod +x src-tauri/resources/$ASSET_NAME/$ASSET_NAME
if [ $? -eq 0 ]; then
    echo "$ASSET_NAME 可执行权限设置成功！"
else
    echo "$ASSET_NAME 可执行权限设置失败！" >&2
    exit 1
fi

chmod +x src-tauri/bin/uv
chmod +x src-tauri/bin/uvx
if [ $? -eq 0 ]; then
    echo "uv 可执行权限设置成功！"
else
    echo "uv 可执行权限设置失败！" >&2
    exit 1
fi


# 下载 bun 的压缩包
echo "正在下载 bun 的压缩包..."
curl -L https://github.com/oven-sh/bun/releases/download/bun-v1.2.13/bun-darwin-aarch64.zip -x ${PROXY_URL} -o src-tauri/bin/bun.zip

# 解压 bun.zip
echo "正在解压 bun.zip..."
unzip -o src-tauri/bin/bun.zip -d src-tauri/bin/
mv src-tauri/bin/bun-darwin-aarch64/bun src-tauri/bin/bun
rm -rf src-tauri/bin/bun-darwin-aarch64

# 给 bun 添加执行权限
chmod +x src-tauri/bin/bun

rm -f src-tauri/bin/bun.zip

# 脚本完成提示
echo "=============================="
echo "所有二进制文件下载并配置完成！"
echo "=============================="
