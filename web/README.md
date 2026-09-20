# 网页版

从仓库根目录执行 `npm run install:apps`，再执行 `npm run dev`。

在本目录也可单独执行 `npm ci`、`npm run dev` 和 `npm run build`。

构建结果位于 `dist/`：`index.html` 配合其余静态资源部署，`摩尔庄园.html` 可直接离线打开。`src/` 包含场景、主角、相机、材质和交互逻辑；`public/` 保存参考素材及细节比较资料。

`npm run test:smoke` 使用本机 Google Chrome 检查离线网页的 16 个视图、主角与资源加载。
