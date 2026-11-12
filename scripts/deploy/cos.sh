#!/usr/bin/env bash
# 腾讯云 COS 部署：按清单增量上传（非 HTML → HTML）→ 清理旧文件。
#
# 构建产物里的 out/.manifest.json 记录每个文件的 sha256；云端保存同一份清单。
# 部署时先读云端清单，只上传"云端没有"或"内容变了"的文件，再清理旧对象。
#
# 依赖 coscli v1.0.9+（https://github.com/tencentyun/coscli/releases）
#
# 环境变量：
#   COS_SECRET_ID / COS_SECRET      SecretId（必填）
#   COS_SECRET_KEY / COS_KEY        SecretKey（必填）
#   COS_BUCKET                      存储桶，如 mint-1250000000（必填）
#   COS_REGION                      区域，如 ap-guangzhou（必填）
#
# 部署目标固定为存储桶根目录，中间文件只放本地临时目录，不上传。
#
# 注意：COS 没有真正的“文件夹”，存储桶只是 key → 对象 的映射，所以“移动文件夹”
# 只能逐个对象复制（云端内部完成，不走公网下行流量）。好处是每个对象的写入都是原子的，
# 读方要么拿到旧内容、要么拿到新内容，不会读到半个文件。
#
# 关于 coscli v1.0.9 的几个行为（已核对源码）：
#   - 凭据用 -i/-k 直接传，不需要也不能用 COSCLI_* 环境变量（v1.0.9 不读它们）；
#   - -Q 之外，ls -r 输出的是表格（Key 在第一列），这里只解析 'cos://<bucket>/' 之后的
#     部分，不受列宽影响；
#   - sync --delete 会交互式确认（未加 --force 时读 stdin，CI 里会挂住），
#     且 --backup-dir 只对本地文件删除生效，所以本脚本自己控制上传顺序与清理。
#
# shellcheck source=common.sh
. "$(dirname "$0")/common.sh"

check_out

SECRET_ID="${COS_SECRET_ID:-${COS_SECRET:-}}"
SECRET_KEY="${COS_SECRET_KEY:-${COS_KEY:-}}"
BUCKET="${COS_BUCKET:-}"
REGION="${COS_REGION:-}"

[ -n "$SECRET_ID" ] || die '缺少 COS_SECRET_ID'
[ -n "$SECRET_KEY" ] || die '缺少 COS_SECRET_KEY'
[ -n "$BUCKET" ] || die '缺少 COS_BUCKET'
[ -n "$REGION" ] || die '缺少 COS_REGION'

# ── coscli 安装/复用 ────────────────────────────────────────────────
# 本脚本自带安装逻辑，CI 与本地都无需预装。
# 复用顺序：PATH 里已有同版本 → 缓存目录里已有同版本 → 下载安装。
# 缓存目录（COSCLI_BIN_DIR，默认 $HOME/.local/bin）是给 GitHub Actions 的
# cache 用的：CI 里恢复缓存后直接命中，不再重复下载 13MB 的二进制。
#
# 环境变量（可选）：
#   COSCLI_VERSION         默认 1.0.9
#   COSCLI_DOWNLOAD_MIRROR 默认 GitHub；国内可用
#                          https://cosbrowser.cloud.tencent.com/software/coscli
#   COSCLI_BIN_DIR         安装/缓存目录，默认 ~/.local/bin
COSCLI_VERSION="${COSCLI_VERSION:-1.0.9}"
COSCLI_BIN_DIR="${COSCLI_BIN_DIR:-$HOME/.local/bin}"
COSCLI_MIRROR="${COSCLI_DOWNLOAD_MIRROR:-}"

sha256_of_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | cut -d' ' -f1
  else
    die '缺少 sha256sum / shasum，无法校验 coscli 下载内容'
  fi
}

# 官方公布的 sha256（来源：coscli Release 页 / 腾讯云文档「下载与安装配置」）。
# 升级 COSCLI_VERSION 时同步更新这里，避免"下载了但没人校验"。
coscli_sha256() {
  case "$1" in
    linux-amd64) printf '%s' 'a07de5ba2800147a700ed29036b0c76a4229088cee68e1682d0eae19b638a915' ;;
    linux-arm64) printf '%s' '5cac5ca3c093f080d6733f4c698c0bdbebdb7b30a6b50835b85de1727b8b6923' ;;
    linux-386) printf '%s' '3ab30f1d067cd46154f33412006211dc912404a09c08f360968ae84b517d7dcb' ;;
    linux-arm) printf '%s' 'bc209844683e6f271862152b20ea99a05b03e75d216fc6b4980d17e6edee97c5' ;;
    darwin-amd64) printf '%s' '49a784987010de548b000ba509df28d600dfde3d530b445edb84bc7900d84c73' ;;
    darwin-arm64) printf '%s' 'cf99d4546e4f2962739c6d25f6e0e7f0b49c94854e2dae237de38d0e8d27c263' ;;
    *) printf '' ;;
  esac
}

coscli_platform() {
  local os arch
  case "$(uname -s)" in
    Linux) os=linux ;;
    Darwin) os=darwin ;;
    *) die "不支持的平台：$(uname -s)，请手动安装 coscli v${COSCLI_VERSION} 后重试" ;;
  esac
  case "$(uname -m)" in
    x86_64 | amd64) arch=amd64 ;;
    aarch64 | arm64) arch=arm64 ;;
    armv7* | armv6*) arch=arm ;;
    i386 | i686) arch=386 ;;
    *) die "不支持的架构：$(uname -m)" ;;
  esac
  printf '%s-%s' "$os" "$arch"
}

# 判断某个 coscli 可执行文件的版本是否匹配
coscli_version_ok() {
  local bin="$1" version
  [ -x "$bin" ] || return 1
  version="$("$bin" --version 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"
  [ "$version" = "v$COSCLI_VERSION" ]
}

ensure_coscli() {
  local bin_dir="$COSCLI_BIN_DIR"

  # 1. PATH 里已有同版本（本地开发机常见）
  if command -v coscli >/dev/null 2>&1 && coscli_version_ok "$(command -v coscli)"; then
    return 0
  fi

  # 2. 缓存目录里已有同版本（CI 恢复了 actions/cache 时走这里，不下载）
  if coscli_version_ok "$bin_dir/coscli"; then
    export PATH="$bin_dir:$PATH"
    ok "复用已缓存的 coscli：$bin_dir/coscli（v${COSCLI_VERSION}）"
    [ -z "${GITHUB_PATH:-}" ] || echo "$bin_dir" >>"$GITHUB_PATH"
    return 0
  fi

  local platform expected
  platform="$(coscli_platform)"
  expected="$(coscli_sha256 "$platform")"
  [ -n "$expected" ] || die "没有 $platform 的校验值，请先更新 cos.sh 里的 sha256 表"

  mkdir -p "$bin_dir"

  # v1.0.9 起 Release 产物名带版本号；国内镜像站点不按版本命名
  local mirror="${COSCLI_MIRROR:-https://github.com/tencentyun/coscli/releases/download/v${COSCLI_VERSION}}"
  local file_name="coscli-v${COSCLI_VERSION}-${platform}"
  case "$mirror" in
    *cosbrowser.cloud.tencent.com*) file_name="coscli-${platform}" ;;
  esac

  local tmp_file
  tmp_file="$(mktemp)"
  info "下载 coscli v${COSCLI_VERSION}（${platform}）…"
  if ! curl -fsSL --retry 3 --retry-delay 2 --connect-timeout 30 \
    "$mirror/$file_name" -o "$tmp_file"; then
    rm -f "$tmp_file"
    die "下载失败：$mirror/$file_name"
  fi

  local actual
  actual="$(sha256_of_file "$tmp_file")"
  if [ "$actual" != "$expected" ]; then
    rm -f "$tmp_file"
    die "coscli 校验失败
  期望：$expected
  实际：$actual
  升级 COSCLI_VERSION 时请同步更新 cos.sh 里的 sha256 表。"
  fi

  install -m 755 "$tmp_file" "$bin_dir/coscli"
  rm -f "$tmp_file"
  export PATH="$bin_dir:$PATH"
  # CI 里把安装目录写进后续 step 的 PATH
  [ -z "${GITHUB_PATH:-}" ] || echo "$bin_dir" >>"$GITHUB_PATH"
  ok "coscli 已安装：$bin_dir/coscli（$(coscli --version)）"
}

need curl
ensure_coscli

# 凭据通过命令行参数传递（v1.0.9 支持 -i/-k），不写配置文件、不读环境变量
COS_ARGS=(-i "$SECRET_ID" -k "$SECRET_KEY" --init-skip)

# 所有 coscli 调用的统一入口；输出存进日志，避免刷屏
cos() { coscli "$@" "${COS_ARGS[@]}" --disable-log; }

info "检查存储桶 ${BUCKET}（${REGION}）…"
cos ls "cos://$BUCKET/" >/dev/null || die '无法访问存储桶，请检查密钥、桶名与区域'

# ── 传输原语：cos.sh / ftp.sh 只需各自实现这些，流程在 incremental.sh 里 ──

# 下载远端文件；不存在返回非零
remote_get() {
  cos cp "cos://$BUCKET/${1#/}" "$2" >/dev/null 2>&1
}

# 上传单个文件并写入缓存头
remote_put() {
  local file="$1" key="$2" meta="$3"
  local args=()
  [ -z "$meta" ] || args=(--meta "$meta")
  cos cp "$file" "cos://$BUCKET/${key#/}" "${args[@]}" >/dev/null
}

# 递归上传目录内容并写入缓存头。
# pattern 非空时按正则过滤：invert=false 只传匹配的，true 只传不匹配的。
remote_push() {
  local dir="$1" prefix="$2" meta="$3" pattern="$4" invert="$5"
  [ -d "$dir" ] || return 0
  local dest="cos://$BUCKET"
  [ -z "$prefix" ] || dest="cos://$BUCKET/${prefix}"
  dest="$dest/"
  local args=(--routines 8)
  [ -z "$meta" ] || args+=(--meta "$meta")
  if [ -n "$pattern" ]; then
    # coscli 的 --exclude/--include 匹配本地绝对路径；这里只做排除，
    # 需要"只传匹配的"时改为排除其余（即用 --include 会有 OR 累积问题）
    if [ "$invert" = true ]; then
      args+=(--exclude "$pattern")
    else
      args+=(--include "$pattern")
    fi
  fi
  cos sync "$dir/" "$dest" -r "${args[@]}" >/dev/null
}

# 批量删除；列表文件每行一个 key
remote_purge() {
  tr '\n' '\0' <"$1" |
    xargs -0 -r -n 200 coscli rm -f "${COS_ARGS[@]}" --disable-log
}

# shellcheck source=incremental.sh
. "$(dirname "$0")/incremental.sh"

deploy_incremental '存储桶根目录'
