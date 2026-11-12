# 由 CI 打包后上传到 Dokploy 的文件树就是这个镜像的构建上下文。
# Dokploy 以 buildType=dockerfile 构建，构建上下文 = 解压根目录（即 out/ 的内容，
# 其中文件名里 Dokploy 不接受的字符已被替换成 __xHH__ 占位符）。
FROM nginx:alpine

# 自定义路由规则：支持 Next.js 静态导出的扁平 .html 结构
COPY nginx.conf /etc/nginx/nginx.conf

# 站点文件
COPY . /usr/share/nginx/html/

# 把占位符还原成真实文件名。
# Dokploy 的 readValidDirectory() 只接受 ASCII 白名单内的字符，而 Next.js 的
# RSC payload 叫 __next.posts.$c$slug.__PAGE__.txt，含 $ 会被拒绝、导致整个
# 上传失败。打包时把 $ 换成 __x24__ 之类，这里按映射表改回来。
#
# 映射表每行「占位名 TAB 真实名」。用 IFS 只按 tab 切分，文件名里的空格不受影响。
# read 用 -r 保留反斜杠，sh 是 alpine 的 busybox sh，行为与 POSIX 一致。
RUN set -eu; \
    cd /usr/share/nginx/html; \
    if [ -f .dokploy-renames.tsv ]; then \
        while IFS="$(printf '\t')" read -r encoded real; do \
            [ -n "$encoded" ] || continue; \
            mkdir -p "$(dirname "$real")"; \
            mv "$encoded" "$real"; \
        done < .dokploy-renames.tsv; \
    fi; \
    rm -f .dokploy-renames.tsv

# 不要把构建用的元文件当成静态资源对外暴露
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/.dockerignore

CMD ["nginx", "-g", "daemon off;"]
