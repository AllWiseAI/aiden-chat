#!/usr/bin/env bash
set -e

# 读取版本
HOST_SERVER_VERSION=$(cat .host_server_version)

# 将 HOST_SERVER_VERSION 写入 .env 文件
# 如果已有这一项，先删除再添加
grep -v '^HOST_SERVER_VERSION=' .env > .env.tmp || true
echo "HOST_SERVER_VERSION=$HOST_SERVER_VERSION" >> .env.tmp
mv .env.tmp .env

echo ".env updated with HOST_SERVER_VERSION=$HOST_SERVER_VERSION"


MODE=""
CONF_FILE="$(cd "$(dirname "$0")"; pwd)/src-tauri/tauri.conf.json"

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$MODE" ]; then
  echo "[ERROR] 必须通过 --mode 指定模式 (dev 或 release)"
  exit 1
fi

if [ ! -f "$CONF_FILE" ]; then
  echo "[ERROR] 配置文件 $CONF_FILE 不存在！"
  exit 1
fi

if [ "$MODE" = "dev" ]; then
  # dev 模式：将 resources/host_server_*/**/* 替换为 ../node_modules/host_server_*/**/*
  perl -pi -e 's#"resources/(host_server_[^/]*/\*\*/\*)"#"../node_modules/$1"#g' "$CONF_FILE"
  echo "[SUCCESS] 已切换为 dev 模式 (../node_modules/host_server_*/**/*)"
elif [ "$MODE" = "release" ]; then
  # release 模式：将 ../node_modules/host_server_*/**/* 替换为 resources/host_server_*/**/*
  perl -pi -e 's#"\.\./node_modules/(host_server_[^/]*/\*\*/\*)"#"resources/$1"#g' "$CONF_FILE"
  echo "[SUCCESS] 已切换为 release 模式 (resources/host_server_*/**/*)"
else
  echo "[ERROR] --mode 只支持 dev 或 release"
  exit 1
fi
