# 增量部署的公共逻辑：与传输协议无关。
#
# cos.sh / ftp.sh 各自实现下面 4 个"原语"，其余流程完全复用本文件：
#
#   remote_get  <远端路径> <本地文件>        下载远端文件；不存在时返回非零
#   remote_put  <本地文件> <远端路径> <meta> 上传单个文件并写入缓存头
#   remote_push <本地目录> <远端前缀> <meta> <正则|空> <是否取反>
#                                            递归上传目录内容并写入缓存头。
#                                            正则非空时：取反=false 只传匹配的，
#                                            取反=true 只传不匹配的
#   remote_purge <列表文件>                  批量删除，列表文件每行一个 key
#
# meta 为该环境的缓存头写法（CSS 传 'Cache-Control:xxx'），空串表示不写。
#
# shellcheck shell=bash

MANIFEST="manifest.json"

# ── 读取远端清单：成功时打印文件数，失败返回非零 ──────────────────────
incremental_load_manifest() {
  local dest="$1"
  rm -f "$dest"
  remote_get "/$MANIFEST" "$dest" || return 1
  python3 -c 'import json,sys
files = json.load(open(sys.argv[1]))["files"]
print(len(files))' "$dest" 2>/dev/null
}

# ── 比对本地清单与远端清单，输出 upload.txt / stale.txt ──────────────
incremental_diff() {
  python3 - "$OUT_DIR/$MANIFEST" "$1" "$TMP_DIR/upload.txt" "$TMP_DIR/stale.txt" <<'PY'
import json, os, sys

local_path, remote_path, upload_out, stale_out = sys.argv[1:5]
local = json.load(open(local_path))["files"]
remote = {}
if os.path.exists(remote_path):
    try:
        remote = json.load(open(remote_path)).get("files", {})
    except Exception:
        remote = {}

# 新增或内容变化：需要上传
upload = [k for k, digest in local.items() if remote.get(k) != digest]
# 上一版有、这一版没有：需要删除。只看清单记录过的文件，绝不动远端其他内容
stale = [k for k in remote if k not in local]
with open(upload_out, "w") as f:
    f.writelines(f"{k}\n" for k in sorted(upload))
with open(stale_out, "w") as f:
    f.writelines(f"{k}\n" for k in sorted(stale))
print(f"需要上传 {len(upload)} 个，未变化 {len(local) - len(upload)} 个")
PY
}

# ── 把待传文件硬链接进暂存目录（跨设备时退回复制）─────────────────────
incremental_stage() {
  local dir="$1"
  rm -rf "$dir"
  mkdir -p "$dir"
  while IFS= read -r key; do
    [ -n "$key" ] || continue
    mkdir -p "$dir/$(dirname "$key")"
    ln "$OUT_DIR/$key" "$dir/$key" 2>/dev/null || cp "$OUT_DIR/$key" "$dir/$key"
  done <"$TMP_DIR/upload.txt"
}

# ── 上传缓存头分组 ────────────────────────────────────────────────────
# 按"文件名是否含内容哈希"决定缓存策略，与 scripts/nginx/nginx.conf 保持一致。
META_IMMUTABLE='Cache-Control:public, max-age=31536000, immutable'
META_NO_CACHE='Cache-Control:no-cache'
META_DAILY='Cache-Control:public, max-age=86400'
# 页面类文件：会被同名覆盖，必须最后上传
PAGE_PATTERN='\.(html|txt|xml)$'

# ── 主流程 ────────────────────────────────────────────────────────────
# 参数：<目标描述>，如 "存储桶根目录" / "FTP 根目录"
deploy_incremental() {
  local target="$1"
  local remote_manifest="$TMP_DIR/remote-manifest.json"
  local upload_dir="$TMP_DIR/upload-stage"

  [ -f "$OUT_DIR/$MANIFEST" ] ||
    die "缺少 ${OUT_DIR}/${MANIFEST}，请先执行 pnpm build（会自动生成清单）"

  # ── 0. 读远端清单 ──
  info "读取${target}上的清单…"
  local remote_count
  if remote_count="$(incremental_load_manifest "$remote_manifest")"; then
    ok "已读取远端清单（${remote_count} 个文件）"
  else
    rm -f "$remote_manifest"
    warn "远端没有可用的清单，本次全量上传"
  fi

  # ── 1. 比对清单 ──
  incremental_diff "$remote_manifest"
  local upload_count stale_count
  upload_count="$(wc -l <"$TMP_DIR/upload.txt" | tr -d ' ')"
  stale_count="$(wc -l <"$TMP_DIR/stale.txt" | tr -d ' ')"

  # ── 2. 上传：先资源、最后页面 ──
  # 顺序保证任何时刻远端都有完整可访问的页面：
  # 先让新资源就位，再覆盖页面文件。
  if [ "$upload_count" -gt 0 ]; then
    incremental_stage "$upload_dir"

    # 2.1 带内容哈希的目录：缓存 365 天
    local hashed_dir
    for hashed_dir in _next/static/chunks _next/static/media compressions; do
      [ -d "$upload_dir/$hashed_dir" ] || continue
      remote_push "$upload_dir/$hashed_dir" "$hashed_dir" "$META_IMMUTABLE" '' false ||
        die "上传 ${hashed_dir} 失败"
    done

    # 2.2 _next/static 下其余内容（buildId 目录等）：
    #     文件名固定、内容随构建变化，不缓存
    local entry name
    for entry in "$upload_dir"/_next/static/*; do
      [ -e "$entry" ] || continue
      name="$(basename "$entry")"
      case "$name" in
        chunks | media) continue ;;
      esac
      if [ -d "$entry" ]; then
        remote_push "$entry" "_next/static/$name" "$META_NO_CACHE" '' false ||
          die "上传 ${name} 资源失败"
      else
        remote_put "$entry" "_next/static/$name" "$META_NO_CACHE" ||
          die "上传 ${name} 失败"
      fi
    done

    # 2.3 其余文件（favicon、cover、logo 等）：缓存一天
    remote_push "$upload_dir" '' "$META_DAILY" "$PAGE_PATTERN" true
    ok '静态资源已就位'

    # 2.4 页面文件最后上传：它们会被同名覆盖，放在最后能保证
    #     引用的资源已经全部就位。
    remote_push "$upload_dir" '' "$META_NO_CACHE" "$PAGE_PATTERN" false
    ok "页面文件已上线（$(grep -cE "$PAGE_PATTERN" "$TMP_DIR/upload.txt" || true) 个）"

    rm -rf "$upload_dir"
  else
    ok '内容无变化，跳过上传'
  fi

  # ── 3. 清理：删除上一版有、这一版没有的文件 ──
  # 必须在更新清单之前完成：清理只看"旧清单里有、新版本没有"的文件，
  # 如果先更新清单，中途中断时没删完的文件就失去了记录，
  # 下次部署再也算不出来，会永久残留在远端。
  if [ "$stale_count" -gt 0 ]; then
    info "清理远端不再需要的旧文件（${stale_count} 个）…"
    remote_purge "$TMP_DIR/stale.txt"
    ok "已清理 ${stale_count} 个旧文件"
  else
    ok '没有需要清理的旧文件'
  fi

  # ── 4. 清单最后上传 ──
  # 它代表"远端已经完整是这个版本"，所以必须是最后一步。
  # 在这之前中断，远端清单仍是旧版，重跑会重新算出同样的待删列表继续删。
  remote_put "$OUT_DIR/$MANIFEST" "$MANIFEST" "$META_NO_CACHE" || die '上传清单失败'

  ok "部署完成：${target}"
}
