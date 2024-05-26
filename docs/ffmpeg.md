# Gif 转 Video

```shell
ffmpeg -i input.gif -c:v libx264 -pix_fmt yuv420p -preset veryslow -y output.mp4
```

# 压缩 Video

```shell
ffmpeg -i input.mp4 -c:v libx264 -vf scale=854:480 -crf 26 -preset medium -y output.mp4
```
