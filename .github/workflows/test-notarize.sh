#!/bin/bash
set -e

APPLE_ID="946815480@qq.com"
APPLE_APP_PASSWORD="evxz-ltry-vxdx-xjdd"
APPLE_TEAM_ID="4N6D8W6W7X"

REQUEST_ID="3dda8c00-db1a-4559-8d79-015ec02ba04b"

if [ -z "$REQUEST_ID" ]; then
  echo "❌ 请输入公证请求 ID 作为参数。"
  echo "用法: ./check-notary-status.sh <request-id>"
  exit 1
fi

echo "🔍 正在查询公证状态: $REQUEST_ID"

xcrun notarytool info "$REQUEST_ID" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --output-format json
