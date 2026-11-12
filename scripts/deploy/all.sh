#!/usr/bin/env bash
# 并行执行全部部署目标；某个目标失败不影响其他目标继续执行，但最终退出码为失败。
#
# 环境变量：
#   DEPLOY_TARGETS=ftp,cos,dokploy   只部署指定目标（默认全部）

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGETS="${DEPLOY_TARGETS:-ftp,cos,dokploy}"
LOG_DIR="$(mktemp -d)"
trap 'rm -rf "$LOG_DIR"' EXIT

declare -a NAMES=() PIDS=()
IFS=',' read -ra LIST <<<"$TARGETS"
for name in "${LIST[@]}"; do
  name="$(tr -d '[:space:]' <<<"$name")"
  [ -n "$name" ] || continue
  [ -f "$DIR/$name.sh" ] || {
    echo "❌ 未知部署目标：${name}（可选：ftp / dokploy / cos）" >&2
    exit 1
  }
  NAMES+=("$name")
  bash "$DIR/$name.sh" >"$LOG_DIR/$name.log" 2>&1 &
  PIDS+=("$!")
done

FAILED=()
for i in "${!PIDS[@]}"; do
  name="${NAMES[$i]}"
  if wait "${PIDS[$i]}"; then
    : # 成功的输出统一在最后打印，避免多目标日志交错
  else
    FAILED+=("$name")
  fi
done

for name in "${NAMES[@]}"; do
  echo "──────── ${name} ────────"
  cat "$LOG_DIR/$name.log"
done

if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "❌ 以下部署目标失败：${FAILED[*]}" >&2
  exit 1
fi
echo "✅ 全部部署目标完成"
