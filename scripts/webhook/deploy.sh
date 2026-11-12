#!/usr/bin/env bash
# 服务器端部署脚本：从 COS 按 manifest 增量更新网站。
#
# 由宝塔 Webhook 触发（也可以手动执行）。部署到服务器上，例如
# /www/deploy/deploy.sh，赋予执行权限：
#   chmod 700 /www/deploy/deploy.sh
#
# 宝塔 Webhook 的「Shell 脚本」里这样调用：
#   bash /www/deploy/deploy.sh "$1"
#
# $1（宝塔的「自定义参数 param」）携带本次部署的目标，格式是分号分隔的
#   key=value 对，例如：
#   download_url=https://mint-1250000000.cos.ap-guangzhou.myqcloud.com;site_dir=/www/wwwroot/example.com
#
# 必填参数（缺任何一个都不执行）：
#   download_url   COS 下载基地址，结尾不带 /
#   site_dir       要更新的站点目录（必须已存在）
#
# 访问控制由宝塔 Webhook 自己负责（它校验 URL 里的 access_key），
# 本脚本直接执行，不再重复校验。
#
# 可选环境变量：
#   CONCURRENCY     并发下载数，默认 16
#
# 流程（与本地 FTP/COS 部署保持一致的顺序，保证切换期间线上可访问）：
#   0. 下载远端 manifest.json
#   1. 与站点上的 manifest.json 比对，算出「需要下载」和「需要删除」，
#      并逐个确认清单里的文件确实在磁盘上（被手动删过的会被补回来）
#   2. 下载非页面资源（_next/static/chunks、media、compressions、其它静态文件）
#   3. 下载页面文件（html/txt/xml）—— 最后替换
#   4. 删除新版本里已不存在的旧文件
#   5. 写入新的 manifest.json —— 必须是最后一步

set -uo pipefail

CONCURRENCY="${CONCURRENCY:-16}"
MANIFEST="manifest.json"

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }
die() {
  printf '[%s] ERROR: %s\n' "$(date '+%F %T')" "$*" >&2
  exit 1
}

# ── 解析 $1（宝塔的 param）──────────────────────────────────────────
# 宝塔对 param 有路径安全过滤，值是 base64url 编码（只含 A-Za-z0-9-_），
# 解码后是分号分隔的 key=value，例如：
#   download_url=https://xxx.myqcloud.com;site_dir=/www/wwwroot/del.wang
PARAM_RAW="${1:-}"

# base64url → 标准 base64，再补齐 = 填充
decode_param() {
  local v="$1" pad
  [ -n "$v" ] || return 0
  v="$(printf '%s' "$v" | tr -d '\n')"
  v="$(printf '%s' "$v" | tr -- '-_' '+/')"
  case $((${#v} % 4)) in
    2) pad='==' ;;
    3) pad='=' ;;
    *) pad='' ;;
  esac
  printf '%s' "$v$pad" | base64 -d 2>/dev/null
}

PARAM="$(decode_param "$PARAM_RAW")"
[ -n "$PARAM" ] || die 'param 为空或解码失败'

parse_param() {
  local key="$1" pair="" rest
  local IFS=';'
  for rest in $PARAM; do
    case "$rest" in
      "$key"=*) pair="${rest#*=}" ;;
    esac
  done
  printf '%s' "$pair"
}

DOWNLOAD_URL="$(parse_param download_url)"
SITE_DIR="$(parse_param site_dir)"

[ -n "$DOWNLOAD_URL" ] || die '缺少 download_url 参数（Webhook 自定义参数里传 download_url=...）'
[ -n "$SITE_DIR" ] || die '缺少 site_dir 参数（Webhook 自定义参数里传 site_dir=...）'

BASE="${DOWNLOAD_URL%/}"
SITE_DIR="${SITE_DIR%/}"

[ -d "$SITE_DIR" ] || die "站点目录不存在：$SITE_DIR"
command -v curl >/dev/null || die '缺少 curl'
command -v python3 >/dev/null || die '缺少 python3'

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

log "开始部署：$SITE_DIR"

# ── 0. 下载远端清单 ─────────────────────────────────────────────────
if curl -fsS --max-time 30 "$BASE/$MANIFEST" -o "$WORK_DIR/remote.json" 2>/dev/null &&
  python3 -c 'import json,sys; json.load(open(sys.argv[1]))["files"]' "$WORK_DIR/remote.json" 2>/dev/null; then
  log '远端清单已获取'
else
  rm -f "$WORK_DIR/remote.json"
  log '远端没有可用的清单，按全量处理'
fi

[ -f "$WORK_DIR/remote.json" ] || die "无法从 ${BASE} 获取清单，中止"

if [ -f "$SITE_DIR/$MANIFEST" ]; then
  cp "$SITE_DIR/$MANIFEST" "$WORK_DIR/local.json" 2>/dev/null || true
fi

# ── 1. 比对：输出 need.txt（要下载） / stale.txt（要删除）─────────────
# 除了清单比对，还逐个确认清单里的文件是否真的在磁盘上（846 个约 0.04 秒），
# 这样服务器上被人手动删过的文件也能被补回来。
python3 - "$WORK_DIR/local.json" "$WORK_DIR/remote.json" \
  "$WORK_DIR/need.txt" "$WORK_DIR/stale.txt" "$SITE_DIR" <<'PYEOF'
import json, os, sys

local_path, remote_path, need_out, stale_out, site = sys.argv[1:6]

def load(path):
    try:
        return json.load(open(path))["files"]
    except Exception:
        return {}

# local = 站点当前清单；remote = COS 最新清单
local = load(local_path)
remote = load(remote_path)

need = [k for k, h in remote.items() if local.get(k) != h]
stale = [k for k in local if k not in remote]

# 清单说一致、但磁盘上其实没有的，也要重新下载
need_set = set(need)
for k in remote:
    if k in need_set:
        continue
    if not os.path.exists(os.path.join(site, k)):
        need.append(k)

with open(need_out, "w") as f:
    f.writelines(k + "\n" for k in sorted(need))
with open(stale_out, "w") as f:
    f.writelines(k + "\n" for k in sorted(stale))
print(f"需要下载 {len(need)} 个，需要删除 {len(stale)} 个")
PYEOF

NEED_COUNT="$(wc -l <"$WORK_DIR/need.txt" | tr -d ' ')"
STALE_COUNT="$(wc -l <"$WORK_DIR/stale.txt" | tr -d ' ')"

# 页面文件（最后下载），其余为资源
grep -E '\.(html|txt|xml)$' "$WORK_DIR/need.txt" >"$WORK_DIR/need_pages.txt" || true
grep -vE '\.(html|txt|xml)$' "$WORK_DIR/need.txt" >"$WORK_DIR/need_assets.txt" || true

# ── 下载单个文件：先写 .part 再 mv，避免中途失败留下半个文件 ────────
download_one() {
  local key="$1"
  local dest="$SITE_DIR/$key"
  local tmp="$dest.part"
  mkdir -p "$(dirname "$dest")"
  if curl -fsS --retry 2 --retry-delay 1 --max-time 300 "$BASE/$key" -o "$tmp" 2>/dev/null; then
    mv -f "$tmp" "$dest"
    chown www:www "$dest" 2>/dev/null || true
    return 0
  fi
  rm -f "$tmp"
  return 1
}

# ── 并发下载一个列表 ────────────────────────────────────────────────
download_list() {
  local list="$1" label="$2"
  [ -s "$list" ] || return 0
  local total
  total="$(wc -l <"$list" | tr -d ' ')"
  log "下载 ${label}：${total} 个"
  local failed="$WORK_DIR/failed_$label.txt"
  : >"$failed"

  while IFS= read -r key; do
    [ -n "$key" ] || continue
    (
      if ! download_one "$key"; then printf '%s\n' "$key" >>"$failed"; fi
    ) &
    while [ "$(jobs -r | wc -l)" -ge "$CONCURRENCY" ]; do wait -n 2>/dev/null || wait; done
  done <"$list"
  wait

  local bad
  bad="$(wc -l <"$failed" | tr -d ' ')"
  if [ "$bad" -gt 0 ]; then
    log "有 ${bad}/${total} 个文件下载失败"
    head -5 "$failed" >&2
    return 1
  fi
  log "${label} 完成"
  return 0
}

# ── 2. 下载资源（非页面）──
download_list "$WORK_DIR/need_assets.txt" 'assets' || die '资源下载失败，本次未改动线上'

# ── 3. 下载页面（最后替换）──
download_list "$WORK_DIR/need_pages.txt" 'pages' || die '页面下载失败，本次未改动线上'

# ── 4. 删除旧文件 ──
# 必须在更新清单之前完成：清理只看「旧清单里有、新版本没有」的文件，
# 如果先更新清单，中途中断时没删完的文件就失去了记录，
# 下次部署再也算不出来，会永久残留在服务器上。
if [ "$STALE_COUNT" -gt 0 ]; then
  log "清理旧文件：${STALE_COUNT} 个"
  while IFS= read -r k; do
    [ -n "$k" ] || continue
    rm -f "$SITE_DIR/$k" 2>/dev/null || true
    # 顺手清理空目录
    d="$(dirname "$SITE_DIR/$k")"
    [ "$d" = "$SITE_DIR" ] || rmdir "$d" 2>/dev/null || true
  done <"$WORK_DIR/stale.txt"
  log '清理完成'
else
  log '没有需要清理的旧文件'
fi

# ── 5. 写入新清单 ──
# 它代表「站点已经完整是这个版本」，所以必须是最后一步。
# 在这之前中断，站点清单仍是旧版，重跑会重新算出同样的待删列表继续删。
cp "$WORK_DIR/remote.json" "$SITE_DIR/$MANIFEST.tmp"
mv -f "$SITE_DIR/$MANIFEST.tmp" "$SITE_DIR/$MANIFEST"
chown www:www "$SITE_DIR/$MANIFEST" 2>/dev/null || true
log '清单已更新'

log "部署完成：下载 ${NEED_COUNT} 个，删除 ${STALE_COUNT} 个"
