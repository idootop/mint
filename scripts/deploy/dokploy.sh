#!/usr/bin/env bash
# Dokploy 部署：把 out/ + Dockerfile + nginx.conf 打成一个 zip，交给 Dokploy 构建并发布。
#
# 环境变量：
#   DOKPLOY_URL       Dokploy 地址，如 https://dokploy.example.com（必填）
#   DOKPLOY_APP_ID    应用 ID（必填）
#   DOKPLOY_API_KEY   API Key（必填）
#
# Dokploy 每次发布都会构建新容器再切换流量，本身不存在中断窗口。
#
# shellcheck source=common.sh
. "$(dirname "$0")/common.sh"

need zip
need curl
check_out

# 存放 Dockerfile / nginx.conf 的目录
DOKPLOY_NGINX_DIR="$ROOT/scripts/nginx"

: "${DOKPLOY_URL:?缺少 DOKPLOY_URL}"
: "${DOKPLOY_APP_ID:?缺少 DOKPLOY_APP_ID}"
: "${DOKPLOY_API_KEY:?缺少 DOKPLOY_API_KEY}"

ZIP="$TMP_DIR/mint-out.zip"
rm -f "$ZIP"

info '打包静态产物…'
# 排除含 $ 的文件名（Dokploy 的路径校验不接受），并把 Dockerfile / nginx.conf 一起打包
(cd "$OUT_DIR" && zip -q -r -X "$ZIP" . -x '*/__next.*.$c$*.txt')
(cd "$DOKPLOY_NGINX_DIR" && zip -q -X "$ZIP" Dockerfile nginx.conf)
ls -lh "$ZIP"

info '校验文件名…'
python3 - "$ZIP" <<'PY'
import re, sys, zipfile

# 与 Dokploy 服务端的路径校验规则一致
pat = re.compile(r'^[\w/. :\[\]+@~(),=%-]{1,500}$')
bad = [n for n in zipfile.ZipFile(sys.argv[1]).namelist() if not pat.match(n.rstrip('/'))]
if bad:
    print(f"❌ 压缩包中有 {len(bad)} 个不被接受的文件名：", file=sys.stderr)
    for n in bad[:20]:
        print("   ", n, file=sys.stderr)
    sys.exit(1)
PY

info '上传并触发 Dokploy 构建…'
curl --fail-with-body --silent --show-error \
  --retry 3 --retry-delay 10 --retry-all-errors \
  --connect-timeout 30 --max-time 3000 \
  -X POST "$DOKPLOY_URL/api/application.dropDeployment" \
  -H "x-api-key: $DOKPLOY_API_KEY" \
  -F "applicationId=$DOKPLOY_APP_ID" \
  -F "zip=@$ZIP"
echo
ok '已提交 Dokploy 部署任务'
