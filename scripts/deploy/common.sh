# 部署公共函数：被 scripts/deploy/*.sh 与 scripts/deploy/all.sh source 使用。
# shellcheck shell=bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="${OUT_DIR:-$ROOT/out}"
TMP_DIR="${RUNNER_TEMP:-${TMPDIR:-$ROOT/temp}}"
mkdir -p "$TMP_DIR"

info() { printf '\033[36m🌟 %s\033[0m\n' "$*"; }
ok() { printf '\033[32m✅ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m⚠️  %s\033[0m\n' "$*" >&2; }
die() {
  printf '\033[31m❌ %s\033[0m\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "缺少命令：${1}"
}

check_out() {
  [ -f "$OUT_DIR/index.html" ] || die "构建产物不完整：${OUT_DIR}/index.html 不存在，请先执行 pnpm build"
}
