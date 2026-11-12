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
# 实测参数（服务器单核 + argon2id 登录约 1.8s/次）：
#   每批 30 个文件 + 并发 8 → 300 个小文件 31 秒（其它组合 35~138 秒）
# 批次太小（20）会退化，太大（300+）无法利用多核并行；
# 并发上限受服务器 MaxClientsPerIP=10 约束。
FILE_BATCH="${FTP_BATCH:-30}"
CONCURRENCY="${FTP_CONCURRENCY:-8}"
# 删除时每个连接串多少个 DELE 命令
PURGE_BATCH="${FTP_PURGE_BATCH:-500}"

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

  # 待传清单：本地路径 \0 远端相对路径
  local list="$TMP_DIR/.push-list-$$"
  : >"$list"

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
    printf '%s\0%s\0' "$dir/$rel" "$target" >>"$list"
    total=$((total + 1))
  done < <(cd "$dir" && find . -type f -print | sed 's|^\./||')

  if [ "$total" -eq 0 ]; then
    rm -f "$list"
    return 0
  fi

  # 这台 FTP 服务器每次登录要 ~1.7s，一个文件一个连接的话 846 个文件要几十分钟，
  # 并发又会因为登录排队大面积超时。所以把每 FILE_BATCH 个文件用 --next 串在
  # 同一个连接里，登录只做一次；批次之间再并发。
  local err_file="$TMP_DIR/.push-err-$$"
  local batch_dir="$TMP_DIR/.push-batch-$$"
  local batch_file="" target
  : >"$err_file"
  rm -rf "$batch_dir"
  mkdir -p "$batch_dir"

  # 切批：每行读两个字段（本地路径、远端路径），攒满 FILE_BATCH 个换下一个文件
  local idx=0 count=0 local_file=""
  while IFS= read -r -d '' local_file && IFS= read -r -d '' target; do
    if [ "$count" -eq 0 ]; then
      idx=$((idx + 1))
      batch_file="$(printf '%s/batch.%05d' "$batch_dir" "$idx")"
    fi
    printf '%s\t%s\n' "$local_file" "$target" >>"$batch_file"
    count=$((count + 1))
    [ "$count" -lt "$FILE_BATCH" ] || count=0
  done <"$list"
  rm -f "$list"

  local batches
  batches="$(find "$batch_dir" -type f | wc -l | tr -d ' ')"
  info "分 ${batches} 批上传（每批最多 ${FILE_BATCH} 个，并发 ${CONCURRENCY}）"

  # 批处理脚本写进临时文件，交给 xargs 并发执行
  local worker="$TMP_DIR/.push-worker-$$"
  cat >"$worker" <<'WORKER'
#!/usr/bin/env bash
set -uo pipefail
auth="$1" base="$2" err_file="$3" batch="$4"

args=()
count=0
while IFS=$'\t' read -r local_file remote_key; do
  [ -n "$local_file" ] || continue
  [ "$count" -eq 0 ] || args+=(--next)
  args+=(-u "$auth" --ftp-create-dirs -T "$local_file" "$base/$remote_key")
  count=$((count + 1))
done <"$batch"
[ "$count" -gt 0 ] || exit 0

if curl -sS --fail "${args[@]}" -o /dev/null 2>&1; then
  while IFS=$'\t' read -r local_file remote_key; do
    [ -n "$local_file" ] || continue
    printf '  ↑ %s\n' "$remote_key" >&2
  done <"$batch"
  exit 0
fi

# 整批失败时逐个重试，定位到具体哪个文件出错
while IFS=$'\t' read -r local_file remote_key; do
  [ -n "$local_file" ] || continue
  if e=$(curl -sS --fail -u "$auth" --ftp-create-dirs -T "$local_file" "$base/$remote_key" -o /dev/null 2>&1); then
    printf '  ↑ %s\n' "$remote_key" >&2
  else
    printf '%s\t%s\n' "$remote_key" "${e:-批内失败}" >>"$err_file"
  fi
done <"$batch"
WORKER
  chmod +x "$worker"

  find "$batch_dir" -type f -print0 | xargs -0 -r -n 1 -P "$CONCURRENCY" \
    "$worker" "$AUTH" "$BASE" "$err_file"

  local failed
  failed="$(wc -l <"$err_file" | tr -d ' ')"
  rm -rf "$batch_dir" "$worker"
  if [ "$failed" -gt 0 ]; then
    warn "有 ${failed}/${total} 个文件上传失败："
    head -3 "$err_file" | sed 's/^/    /' >&2
    [ "$failed" -le 3 ] || echo "    …（共 ${failed} 个）" >&2
    rm -f "$err_file"
    return 1
  fi
  rm -f "$err_file"
  return 0
}





# 批量删除；同一个会话里依次执行 DELE，每批最多 200 条
remote_purge() {
  local list="$1"
  local total
  total="$(wc -l <"$list" | tr -d ' ')"
  [ "$total" -gt 0 ] || return 0

  # 删除也走「分批 + 并发」：一批 = 一条连接里串 N 个 DELE。
  # 单条连接串行删 300 个文件实测要 42 秒，并发后能压到十几秒。
  # FTP 的 DELE 只是控制命令，不用建数据连接，所以每批可以放很多。
  local quote_file="$TMP_DIR/.ftp-quote"
  local batch_dir="$TMP_DIR/.purge-batch-$$"
  local done_file="$TMP_DIR/.purge-done-$$"
  : >"$quote_file"
  : >"$done_file"
  rm -rf "$batch_dir"
  mkdir -p "$batch_dir"

  split -l "$PURGE_BATCH" "$list" "$batch_dir/batch."

  # 每条连接：批量 DELE，最后删掉载体文件；成功的批写一行到 done 文件
  for bf in "$batch_dir"/batch.*; do
    (
      q=()
      while IFS= read -r key; do
        [ -n "$key" ] || continue
        q+=(-Q "DELE /$key")
      done <"$bf"
      q+=(-Q "DELE /.ftp-quote")
      curl -sS -u "$AUTH" -T "$quote_file" "$BASE$(url_encode "/.ftp-quote")" \
        "${q[@]}" >/dev/null 2>&1 || true
    ) &
    while [ "$(jobs -r | wc -l)" -ge "$CONCURRENCY" ]; do
      wait -n 2>/dev/null || wait
    done
  done
  wait

  rm -rf "$batch_dir" "$quote_file" "$done_file"
  # 删除不存在的文件会返回 550，属正常情况，不因此中断部署
  ok "已删除 ${total} 个旧文件"
}


# shellcheck source=incremental.sh
. "$(dirname "$0")/incremental.sh"

deploy_incremental 'FTP 根目录'
