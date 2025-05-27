#!/usr/bin/env bash
set -e

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
