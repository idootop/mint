#!/usr/bin/env bash
# 本地部署入口：从 .env 加载变量，再调用对应的部署脚本。
#
# 用法（在仓库根目录执行）：
#   bash scripts/deploy/local.sh ftp
#   bash scripts/deploy/local.sh cos
#   bash scripts/deploy/local.sh dokploy
#   bash scripts/deploy/local.sh all
#
# 注意：这会真的发布到线上环境。只想验证产物时用 `pnpm preview` 本地起服务。
#
# .env 格式：KEY=VALUE，支持 # 注释与值两侧的引号。
# 已存在的环境变量优先，不会被 .env 覆盖（便于临时覆盖某一项）：
#   COS_REGION=ap-guangzhou bash scripts/deploy/local.sh cos

set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"

ENV_FILE="${ENV_FILE:-$ROOT/.env}"

# ── 加载 .env ────────────────────────────────────────────────────────
# 用一个很小的解析器，避免 source .env 带来的问题（值里有特殊字符时会被
# shell 重新解释，比如密码中的 $、`、\）。这里只做 KEY=VALUE 的字面赋值。
load_env() {
  local file="$1"
  [ -f "$file" ] || return 0

  local key value line escaped
  while IFS= read -r line || [ -n "$line" ]; do
    # 去掉行尾的 \r（Windows 换行）
    line="${line%$'\r'}"

    # 跳过空行与注释（允许前导空白）
    case "${line#"${line%%[![:space:]]*}"}" in
      '' | '#'*) continue ;;
    esac

    # 允许 `export KEY=VALUE`
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line#export }"

    case "$line" in
      *=*) ;;
      *) continue ;;
    esac

    key="${line%%=*}"
    value="${line#*=}"

    # 去掉键名两侧空白
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [ -n "$key" ] || continue

    # 值：去掉两侧空白（但引号内的空白要保留，所以先判断引号）
    value="${value#"${value%%[![:space:]]*}"}"
    case "$value" in
      \"*)
        value="${value#\"}"
        value="${value%%\"*}"
        ;;
      \'*)
        value="${value#\'}"
        value="${value%%\'*}"
        ;;
      *)
        # 未加引号：去掉行尾空白与行内注释（" #" 之后视为注释）
        value="${value%"${value##*[![:space:]]}"}"
        case "$value" in
          *' #'*) value="${value%% #*}" ;;
        esac
        value="${value%"${value##*[![:space:]]}"}"
        ;;
    esac

    # 已存在的环境变量优先，便于临时覆盖某一项。
    # 用 eval 赋值时对 value 做单引号转义，避免 $、`、\ 被重新解释；
    # bash 3.2 没有 printf -v，这里是兼容写法。
    if [ -z "${!key:-}" ]; then
      escaped="$(printf '%s' "$value" | sed "s/'/'\\\\''/g")"
      eval "export $key='$escaped'"
    fi
  done <"$file"
}

# .env 缺失时直接报错；确实不需要任何变量时可用 ENV_FILE= 跳过
if [ -n "$ENV_FILE" ] && [ ! -f "$ENV_FILE" ]; then
  echo "❌ 找不到 ${ENV_FILE}" >&2
  echo "   先复制模板：cp .env.example .env，再填写真实值。" >&2
  exit 1
fi
[ -z "$ENV_FILE" ] || load_env "$ENV_FILE"

# ── 选择部署目标 ─────────────────────────────────────────────────────
TARGET="${1:-}"
case "$TARGET" in
  ftp | cos | dokploy | webhook | all) ;;
  '' | -h | --help)
    echo "用法: bash scripts/deploy/local.sh <ftp|cos|dokploy|all>"
    exit 0
    ;;
  *)
    echo "❌ 未知目标：${TARGET}（可选：ftp / cos / dokploy / webhook / all）" >&2
    exit 1
    ;;
esac

# 提示一下这次会发布到哪些环境，避免敲错目标
echo "📦 构建产物：${ROOT}/out"
[ -f "$ROOT/out/index.html" ] || {
  echo "❌ out/index.html 不存在，先执行 pnpm build" >&2
  exit 1
}

# 缺变量时给出明确提示，而不是等部署脚本跑一半才失败
missing=()
need_var() {
  [ -n "${!1:-}" ] || missing+=("$1")
}
case "$TARGET" in
  ftp)
    need_var FTP_URL
    need_var FTP_USER
    echo "🌐 目标：FTP ${FTP_URL:-（未设置）}"
    ;;
  cos)
    need_var COS_SECRET_ID
    need_var COS_SECRET_KEY
    need_var COS_BUCKET
    need_var COS_REGION
    echo "🌐 目标：COS ${COS_BUCKET:-（未设置）} / ${COS_REGION:-（未设置）}"
    ;;
  dokploy)
    need_var DOKPLOY_URL
    need_var DOKPLOY_APP_ID
    need_var DOKPLOY_API_KEY
    echo "🌐 目标：Dokploy ${DOKPLOY_URL:-（未设置）}"
    ;;
  webhook)
    need_var WEBHOOK_URL
    need_var WEBHOOK_SITE_DIR
    need_var WEBHOOK_DOWNLOAD_URL
    echo "🌐 目标：Webhook → ${WEBHOOK_SITE_DIR:-（未设置）}"
    ;;
  all)
    echo "🌐 目标：全部（FTP / COS / Dokploy / Webhook）"
    ;;
esac
if [ "${#missing[@]}" -gt 0 ]; then
  echo "❌ .env 缺少：${missing[*]}" >&2
  exit 1
fi

# ── 执行 ─────────────────────────────────────────────────────────────
exec bash "$DIR/$TARGET.sh"
