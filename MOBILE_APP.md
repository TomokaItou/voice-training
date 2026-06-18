# 手机使用版

这个项目现在带有 PWA 外壳，可以通过手机浏览器安装到主屏幕。核心训练仍然运行在浏览器里，所以麦克风、离线缓存和安装能力都依赖 HTTPS。

## 推荐发布方式

1. 把 `voice-training-main/voice-training-main` 目录部署到任意 HTTPS 静态站点，例如 GitHub Pages、Netlify、Vercel 或自己的 HTTPS 服务器。
2. 用手机打开 HTTPS 地址。
3. Android Chrome 可以在浏览器菜单里选择安装应用。iPhone Safari 使用分享菜单里的添加到主屏幕。
4. 第一次进入训练并点击开始时，允许麦克风权限。

## 本地预览

电脑本机可直接运行：

```powershell
python -m http.server 8080
```

然后在电脑浏览器打开 `http://localhost:8080`。如果要让手机使用麦克风，不能只用局域网 HTTP 地址，因为手机浏览器会拒绝麦克风权限。请部署到 HTTPS，或使用受信任证书的 HTTPS 本地服务。

## 可离线部分

安装后，主界面、样式和本地训练脚本会被缓存。上传的歌曲、录音库和可选 Python 服务不属于离线缓存；人声分离和 Whisper 仍需要原来的本地服务或后端服务支持。
