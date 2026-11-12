#!/usr/bin/env bash
# FTP 部署：按清单增量上传（先资源 → 最后页面）→ 清理旧文件。
#
# 增量逻辑（读清单、比对、分组、顺序、清理）在 scripts/deploy/incremental.sh，
# 与腾讯云 COS 共用；本文件只实现 FTP 的 5 个传输原语。
#
# 部署目标固定为 FTP 登录后的根目录（也就是网站根目录），不提供配置项。
#
# 环境变量：
#   FTP_URL         FTP 地址，带协议和端口，如 ftp://xxx.xxx.xxx.xxx:21（必填）
#   FTP_USER        FTP 用户（必填）
#   FTP_PASSWORD    FTP 密码
#
# shellcheck source=common.sh
. "$(dirname "$0")/common.sh"

need curl
check_out

FTP_URL="${FTP_URL:-}"
FTP_USER="${FTP_USER:-}"
FTP_PASSWORD="${FTP_PASSWORD:-}"

[ -n "$FTP_URL" ] || die '缺少 FTP_URL，例如 ftp://192.0.2.1:21'
[ -n "$FTP_USER" ] || die '缺少 FTP_USER'
case "$FTP_URL" in
  ftp://* | ftps://*) ;;
  *) die 'FTP_URL 必须以 ftp:// 或 ftps:// 开头' ;;
esac

AUTH="$FTP_USER:$FTP_PASSWORD"
BASE="${FTP_URL}"
# 并发上传数。FTP 每个文件都要重新建连（约 8ms），是主要开销。
CONCURRENCY="${FTP_CONCURRENCY:-16}"

# URL 编码路径（兼容中文与空格），保留 / 分隔。
# 用 bash 内置字符串处理，避免每个文件都启动一个 python 进程。
url_encode() {
  local str="$1" out="" ch i
  # 先用 curl 的 --data-urlencode 之外的办法：直接按字节转义
  for ((i = 0; i < ${#str}; i++)); do
    ch="${str:i:1}"
    case "$ch" in
      [a-zA-Z0-9._~/-]) out+="$ch" ;;
      *) out+="$(printf '%%%02X' "'$ch")" ;;
    esac
  done
  printf '%s' "$out"
}

# ── 传输原语 ─────────────────────────────────────────────────────────

# 下载远端文件；不存在返回非零
remote_get() {
  curl -sS --fail -u "$AUTH" "$BASE$(url_encode "$1")" -o "$2" 2>/dev/null
}

# FTP 没有 per-file 的元数据写入能力，缓存头统一在 nginx 侧配置
# （见 scripts/nginx/nginx.conf），所以这里的 meta 参数不用。
# shellcheck disable=SC2317
remote_put() {
  local file="$1" key="$2"
  curl -sS --fail -u "$AUTH" --ftp-create-dirs -T "$file" "$BASE$(url_encode "/${key#/}")" >/dev/null
}

# 递归上传目录内容。pattern 非空时按正则过滤：invert=false 只传匹配的，
# true 只传不匹配的。
#
# 实现：bash 侧先算好"本地路径<TAB>目标 URL"清单，再交给 xargs -P 并行 curl。
# 比在 bash 里 fork 子 shell 快，且编码逻辑留在 bash 里更可控。
remote_push() {
  # meta 不使用：FTP 侧缓存头统一由 nginx 配置
  # shellcheck disable=SC2034
  local dir="$1" prefix="$2" meta="$3" pattern="$4" invert="$5"
  [ -d "$dir" ] || return 0

  local jobs="$TMP_DIR/.push-jobs-$$"
  : >"$jobs"
  local rel
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    if [ -n "$pattern" ]; then
      if printf '%s' "$rel" | grep -qE "$pattern"; then
        [ "$invert" = true ] && continue
      else
        [ "$invert" = true ] || continue
      fi
    fi
    local key="$rel"
    [ -z "$prefix" ] || key="$prefix/$rel"
    printf '%s\0%s%s\0' "$dir/$rel" "$BASE" "$(url_encode "/$key")" >>"$jobs"
  done < <(cd "$dir" && find . -type f -print | sed 's|^\./||')

  local rc=0
  if [ -s "$jobs" ]; then
    # NUL 分隔：每次取「本地路径 + URL」两个参数交给 curl
    xargs -0 -r -n 2 -P "$CONCURRENCY" \
      sh -c 'exec curl -sS --fail -u "$0" --ftp-create-dirs -T "$1" "$2"' \
      "$AUTH" <"$jobs" 2>/dev/null || rc=$?
  fi
  rm -f "$jobs"

  if [ "$rc" -ne 0 ]; then
    warn "部分文件上传失败（curl rc=${rc}）"
    return 1
  fi
  return 0
}

# 批量删除；同一个会话里依次执行 DELE，每批最多 200 条
remote_purge() {
  local list="$1"
  local quote_file="$TMP_DIR/.ftp-quote"
  : >"$quote_file"
  local batch=() failed=0
  flush_batch() {
    [ "${#batch[@]}" -gt 0 ] || return 0
    curl -sS -u "$AUTH" -T "$quote_file" "$BASE$(url_encode "/.ftp-quote")" "${batch[@]}" \
      >/dev/null 2>&1 || failed=$((failed + 1))
    batch=()
  }
  local key
  while IFS= read -r key; do
    [ -n "$key" ] || continue
    batch+=(-Q "DELE /$key")
    [ "${#batch[@]}" -lt 200 ] || flush_batch
  done <"$list"
  # 最后一批顺手删掉远端用来发起会话的载体文件，避免在站点根目录留下垃圾
  batch+=(-Q "DELE /.ftp-quote")
  flush_batch
  rm -f "$quote_file"
  # 删除不存在的文件会返回 550，属正常情况，不因此中断部署
  [ "$failed" -eq 0 ] || warn "有 ${failed} 批删除未完全成功，不影响访问"
}

# shellcheck source=incremental.sh
. "$(dirname "$0")/incremental.sh"

deploy_incremental 'FTP 根目录'
