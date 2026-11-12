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
  # 只处理会破坏 URL 的字符：空格与百分号。
  # 像 $ ( ) [ ] 在 RFC 3986 的 path 段里本来就合法，保持原样即可。
  # Next 的产物里有 __next.posts.$c$slug.__PAGE__.txt 这种名字，
  # 错误地编码成 %24 后部分 FTP 服务端会拒绝写入（curl rc=123）。
  #
  # 中文等非 ASCII 由 curl 自己处理，这里不动（产物里目前也没有）。
  local path="$1"
  path="${path//%/%25}"
  path="${path// /%20}"
  printf '%s' "$path"
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

  # 一行一个任务：本地路径 \0 目标 URL \0
  local jobs="$TMP_DIR/.push-jobs-$$"
  : >"$jobs"

  local rel total=0
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    if [ -n "$pattern" ]; then
      if printf '%s' "$rel" | grep -qE "$pattern"; then
        [ "$invert" = true ] && continue
      else
        [ "$invert" = true ] || continue
      fi
    fi
    local target="$rel"
    [ -z "$prefix" ] || target="$prefix/$rel"
    printf '%s\0%s%s\0%s\0' "$dir/$rel" "$BASE" "$(url_encode "/$target")" "$target" >>"$jobs"
    total=$((total + 1))
  done < <(cd "$dir" && find . -type f -print | sed 's|^\./||')

  if [ "$total" -eq 0 ]; then
    rm -f "$jobs"
    return 0
  fi

  # 并行上传，每成功一个就往 stderr 打一行路径（>> /dev/stderr 保证不被吞）
  local failed_file="$TMP_DIR/.push-failed-$$"
  : >"$failed_file"
  # sh -c 的 $0 是 AUTH，$1 是失败记录文件；xargs 传入的两个参数从 $2 开始。
  # 成功时打印远端相对路径（和 COS 侧保持一致），失败记到文件里统一汇报。
  # sh -c 的 $0=AUTH、$1=失败记录文件，xargs 传入的三个参数从 $2 开始
  xargs -0 -r -n 3 -P "$CONCURRENCY" sh -c '
    if curl -sS --fail -u "$0" --ftp-create-dirs -T "$2" "$3" >/dev/null 2>&1; then
      printf "  ↑ %s\n" "$4" >&2
    else
      printf "%s\n" "$4" >>"$1"
    fi
  ' "$AUTH" "$failed_file" <"$jobs" || true

  local failed
  failed="$(wc -l <"$failed_file" | tr -d ' ')"
  rm -f "$jobs"
  if [ "$failed" -gt 0 ]; then
    warn "有 ${failed}/${total} 个文件上传失败："
    head -3 "$failed_file" | sed 's/^/    /' >&2
    [ "$failed" -le 3 ] || echo "    …（共 ${failed} 个）" >&2
    rm -f "$failed_file"
    return 1
  fi
  rm -f "$failed_file"
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
