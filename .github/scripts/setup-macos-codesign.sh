#!/bin/bash

set -euo pipefail

CERT_PATH="$RUNNER_TEMP/certificate.p12"
KEYCHAIN_NAME="build.keychain"
KEYCHAIN_PASSWORD="build_password"

echo "📦 Decoding certificate..."
echo "$APPLE_CERTIFICATE" | base64 --decode > "$CERT_PATH"

echo "🔐 Creating and configuring keychain..."
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
security default-keychain -s "$KEYCHAIN_NAME"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
security list-keychains -s "$KEYCHAIN_NAME"

echo "📥 Importing certificate into keychain..."
security import "$CERT_PATH" -k "$KEYCHAIN_NAME" -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign

echo "🔑 Setting key partition list..."
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

echo "🔍 Available signing identities:"
security find-identity -v -p codesigning
