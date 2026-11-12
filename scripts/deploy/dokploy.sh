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
# 关于文件名转义：
# Dokploy 解压 zip 时会用 readValidDirectory() 校验每个条目的绝对路径，
# 规则是 /^[\w/. :[\]+@~(),=%-]{1,500}$/（packages/server/src/wss/utils.ts）。
# Node 的 \w 只含 A-Za-z0-9_，所以 $ 和任何非 ASCII 字符都会被拒绝。
# Next.js 的 RSC payload 叫 __next.posts.$c$slug.__PAGE__.txt，正好踩中。
#
# 做法：打包时把这类字符换成 ASCII 占位符（如 $ → __x24__），并写一份映射
# 到容器里的 .dokploy-renames.tsv；Dockerfile 在 COPY 之后按映射改回原名。
# 这样 Dokploy 看到的名字是合法的，最终镜像里的文件名才是真实的。
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
STAGE="$TMP_DIR/dokploy-stage"
rm -rf "$ZIP" "$STAGE"

# ── 1. 按 Dokploy 的规则准备构建上下文 ───────────────────────────────
info '准备构建上下文（转义 Dokploy 不接受的字符）…'
python3 - "$OUT_DIR" "$STAGE" <<'PY'
import os
import shutil
import sys

src, dst = sys.argv[1], sys.argv[2]

# 与 Dokploy packages/server/src/wss/utils.ts 的白名单一致。
# Node 的 \w 只匹配 [A-Za-z0-9_]，这里显式列出来，避免 Python 的 \w 更宽。
ALLOWED = set(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    "_/. :[]+@~(),=%-"
)

# 系统垃圾文件，不打包
JUNK = {".DS_Store", "Thumbs.db", ".gitkeep"}


def encode(rel):
    # 不安全字符换成 __xhhhhhh__，定长 6 位十六进制（覆盖到 U+10FFFF）。
    # 定长很重要：如果长度可变，真实文件名 emoji__x1f600__.txt 会和
    # emoji😀.txt 转义成同一个名字。
    return "".join(ch if ch in ALLOWED else "__x%06x__" % ord(ch) for ch in rel)


renames = []
taken = {}
for root, dirs, files in os.walk(src):
    dirs.sort()
    rel_root = os.path.relpath(root, src)
    rel_root = "" if rel_root == "." else rel_root

    for name in sorted(files):
        rel = os.path.join(rel_root, name) if rel_root else name
        # 系统垃圾文件不该上传（后置任务已经清过，这里兜底）
        if name in JUNK:
            continue
        encoded = encode(rel)

        # 转义后必须唯一，否则会静默覆盖别的文件
        if encoded in taken:
            raise SystemExit(
                f"转义冲突：{taken[encoded]!r} 和 {rel!r} 都会变成 {encoded!r}"
            )
        taken[encoded] = rel

        target = os.path.join(dst, encoded)
        os.makedirs(os.path.dirname(target) or dst, exist_ok=True)
        shutil.copy2(os.path.join(src, rel), target)
        if encoded != rel:
            renames.append((encoded, rel))

# 映射表本身也要写过，空表也写，Dockerfile 里判断存在与否
with open(os.path.join(dst, ".dokploy-renames.tsv"), "w", encoding="utf-8") as f:
    for encoded, real in renames:
        f.write(encoded + "\t" + real + "\n")

print(f"  转义文件 {len(renames)} 个")
PY

# ── 2. 校验：转义后的路径必须全部能通过 Dokploy 的规则 ────────────────
info '校验转义结果…'
python3 - "$STAGE" <<'PY'
import os
import re
import sys

# 这里直接用 Dokploy 源码里的正则本身，避免两边写的规则不一致
PAT = re.compile(r"^[\w/. :[\]\+@~(),=%-]{1,500}$")
BASE = "/etc/dokploy/applications/x/code"

stage = sys.argv[1]
bad = []
for root, dirs, files in os.walk(stage):
    for name in dirs + files:
        rel = os.path.relpath(os.path.join(root, name), stage)
        if not PAT.match(BASE + "/" + rel):
            bad.append(rel)

if bad:
    print(f"  仍有 {len(bad)} 个路径不被 Dokploy 接受：", file=sys.stderr)
    for n in bad[:10]:
        print("   ", n, file=sys.stderr)
    sys.exit(1)
print("  全部通过")
PY

# ── 3. 打包 ──────────────────────────────────────────────────────────
info '打压缩包…'
(cd "$STAGE" && zip -q -r -X "$ZIP" .)
(cd "$DOKPLOY_NGINX_DIR" && zip -q -X "$ZIP" Dockerfile nginx.conf)
ls -lh "$ZIP"

# ── 4. 触发构建 ──────────────────────────────────────────────────────
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
