# Aiden

Build with tauri.

## How to start

```bash
yarn install

yarn dev # for web
yarn app:dev # for app dev
yarn app:build # for app build
```

## Auto download binaries(Only in dev)
Make sure you have the right `.env` file before running the script.
The `.env` file should contain the following variables:
```
GITHUB_TOKEN=your GITUB_TOKEN
```

Run the script to download the binaries
```bash
bash ./download_binaries.sh
```

## How to build (Local)

```bash
yarn tauri build
yarn tauri build:intel # for Intel Mac
yarn tauri build:arch # for Arch Mac
```

For local build we need to make sure we have installed the "x86-64-apple-darwin" target for the Rust toolchain.

```bash
export RUSTUP_DIST_SERVER=https://rsproxy.cn
export RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup

rustup target add x86_64-apple-darwin
```

## How to build (Release)

Create a new release with a new version tag and the GitHub Action will automatically build the app and upload the binaries to the release.

## Logs location
```bash
~/Library/Application\ Support/com.aiden.chat/Logs
```

## MCP config location
```bash
~/Library/Application\ Support/com.aiden.chat/config
```

## Default MCP config update steps:

1. update the `version` in `src-tauri/resource/tauri.conf.json`
2. update the mcp server config content, make sure you set the right `"aiden_type": "default"` in the config file.

