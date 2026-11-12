#!/usr/bin/env bash
# Webhook 部署：触发服务器上的脚本，由它从 COS 按 manifest 增量拉取更新网站。
#
# 前提：站点文件已经通过 `pnpm deploy:cos` 推到 COS，这里只是让服务器去拉。
#
# 环境变量：
#   WEBHOOK_URL           宝塔 Webhook 的完整调用地址（必填），
#                         access_key 已包含在 URL 里，例如
#                         https://1.2.3.4:8080/hook?access_key=xxx
#                         （https 且证书是自签时不影响，调用时不校验证书）
#   WEBHOOK_SITE_DIR      服务器上要更新的站点目录（必填），如 /www/wwwroot/example.com
#   WEBHOOK_DOWNLOAD_URL  COS 下载基地址（必填），如
#                         https://mint-xxxx.cos.ap-hongkong.myqcloud.com
#
# 只负责触发：请求发出后立即返回，服务器在后台自己完成部署。
# 部署结果不在本次调用的返回值里体现，需要看服务器日志。
#
# shellcheck source=common.sh
. "$(dirname "$0")/common.sh"

need curl
check_out

WEBHOOK_URL="${WEBHOOK_URL:-}"
WEBHOOK_SITE_DIR="${WEBHOOK_SITE_DIR:-}"
WEBHOOK_DOWNLOAD_URL="${WEBHOOK_DOWNLOAD_URL:-}"

[ -n "$WEBHOOK_URL" ] || die '缺少 WEBHOOK_URL'
[ -n "$WEBHOOK_SITE_DIR" ] || die '缺少 WEBHOOK_SITE_DIR'
[ -n "$WEBHOOK_DOWNLOAD_URL" ] || die '缺少 WEBHOOK_DOWNLOAD_URL'

MANIFEST="manifest.json"
[ -f "$OUT_DIR/$MANIFEST" ] || die "缺少 ${OUT_DIR}/${MANIFEST}，请先执行 pnpm build"

# param 里携带本次部署目标，服务器端从 $1 解析。
# 格式先用分号分隔的 key=value，再做 base64url 编码：
# 宝塔对 param 有路径安全过滤，出现 / . : ; , 等字符会直接 404，
# base64url 只用 A-Za-z0-9-_ 这套字符，可以安全通过。
PARAM="download_url=${WEBHOOK_DOWNLOAD_URL%;*};site_dir=${WEBHOOK_SITE_DIR%;*}"
PARAM_ESCAPED="$(printf '%s' "$PARAM" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')"
case "$PARAM_ESCAPED" in
  *[!A-Za-z0-9_-]*) die "param 编码异常：${PARAM_ESCAPED}" ;;
esac

SEP='?'
case "$WEBHOOK_URL" in
  *\?*) SEP='&' ;;
esac
TARGET="${WEBHOOK_URL}${SEP}param=${PARAM_ESCAPED}"

# 不让密钥出现在日志里
SAFE_URL="$(printf '%s' "$WEBHOOK_URL" | sed -E 's/(access_key|secret|token)=[^&]*/\1=***/g')"
info "触发 Webhook：${SAFE_URL}"
info "目标站点：${WEBHOOK_SITE_DIR}"

# 触发即返回：服务器收到请求就会开始部署，具体成败由服务器自己负责，
# 这里只确认请求已经发出（--max-time 限制的是握手/发送，不等待部署完成）。
# -o /dev/null 丢弃响应体；宝塔的 webhook 通常立刻返回，不会阻塞。
# -k 跳过证书校验：宝塔的 webhook 一般是 https + 自签证书。
if curl -sSk --fail -o /dev/null --connect-timeout 10 --max-time 15 "$TARGET"; then
  ok "已触发，服务器将开始从 COS 同步到 ${WEBHOOK_SITE_DIR}"
else
  case $? in
    28) die '连接 Webhook 超时，请检查 WEBHOOK_URL 是否可达' ;;
    *) die 'Webhook 调用失败，请检查 WEBHOOK_URL 是否正确' ;;
  esac
fi
