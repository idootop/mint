# 由 CI 打包后上传到 Dokploy 的文件树就是这个镜像的构建上下文。
# Dokploy 以 buildType=dockerfile 构建，构建上下文 = 解压根目录（即 out/ 的内容）。
FROM nginx:alpine

# 自定义路由规则：支持 Next.js 静态导出的扁平 .html 结构
COPY nginx.conf /etc/nginx/nginx.conf

# 站点文件
COPY . /usr/share/nginx/html/

# 不要把 Dockerfile / 配置本身当成静态资源对外暴露
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/.dockerignore

CMD ["nginx", "-g", "daemon off;"]
