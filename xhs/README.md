# 小红书离线小工具

在本目录执行：

```sh
npm ci
npm run build
npm run package
```

打包结果为仓库根目录的 `mole-manor-xhs.zip`。ZIP 根目录包含 `index.html`、`app.js`、`boot.js`、`style.css` 和 `licenses.json`。

`src/` 为源码，`mobile-assets/` 是压缩后的纹理，`public/references/` 为参考原图。`vendor/`、`app/` 和 `evidence/` 在本地生成，不提交到 Git。构建脚本会从固定版本 Three.js 生成离线渲染模块，检查 ES2017 语法与禁用能力，并将纹理嵌入产物。

CSS 在 JavaScript 加载前旋转竖屏首帧，加载页和错误页也保持 90°。场景运行时仅保留一个活动场景。循环背景音乐在首次交互后播放。

验证需安装 Google Chrome：`npm run test:runtime`；完整手机触摸模拟为 `npm run test:mobile`，另需 Python 3 与 Pillow，可用 `MANOR_PYTHON` 指定 Python 路径。实际小红书容器与实体手机仍需单独验收。
