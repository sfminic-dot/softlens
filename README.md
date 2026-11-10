# SoftLens · 柔光

为普通网页的白色背景添加柔和渐变，保持文字、图片清晰。Chrome Manifest V3 / TypeScript / Vite / 原生 HTML/CSS。

## 安装与更新

1. 从本仓库下载代码 ZIP，解压到固定目录。
2. 打开 `chrome://extensions`，开启开发者模式。
3. 点击“加载已解压的扩展程序”，选择仓库中的 **dist** 文件夹。
4. 刷新已有网页。使用工具栏扩展按钮调整效果。

dist 已包含构建结果，安装无需 Node.js。GitHub Actions 的构建产物也包含 `soft-lens-install.zip`，解压后选择包含 manifest.json 的目录。

更新时覆盖原目录，在扩展管理页点击“重新加载”，再刷新网页。不必重新安装，原设置保留。弹窗发现旧版网页脚本时会显示提示。仅覆盖磁盘文件不会自动替换浏览器内已运行的脚本。

## 功能

- 全局开关、按 hostname 记忆的网站开关，全局关闭优先。
- 0–100% 连续强度，默认 20%；对应渐变透明度 0–0.62。
- 16 套配色，默认截图同款；包含蓝紫、暖桃、薄荷、鸢尾、晴空、青玉、玫瑰、琥珀、砂岩、海盐、葡萄、落日、柠檬、樱花、青柠。
- 设置存于 chrome.storage.local，即时同步所有已注入网页。
- 弹窗按可用屏幕空间调整宽高和卡片列数，支持键盘与焦点状态。
- Fullscreen API 全屏时隐藏效果，退出恢复。

当前版本采用**静态背景染色**。识别白色或近白色的背景元素，仅在背景层绘制多层 radial-gradient，不覆盖前景、不洗灰文字、不修改网页布局。流动动画已停用，减少动态效果的系统偏好自然得到满足。恢复默认重置全局设置与当前网站，保留其他网站选择。

## 性能

读取与写入分批执行，浏览器空闲时每批最多处理 80 个节点，约 3ms 后主动让出主线程（单次浏览器操作可能超过该时间）。新增元素仅检查新增子树，class/style 变化只检查元素本身。队列按元素去重，最多 1024 项，溢出合并为一次分批检查。

关闭效果、强度为零、网站禁用、全屏或标签页后台时停止识别并释放待处理引用；恢复前台后检查遗漏变化。无轮询、常驻后台进程、动画帧循环或逐帧扫描。配色变化只更新一份样式规则，不重新遍历网页。

受控性能测试与原始数据见 performance-results.json。结果不代表所有网站的 CPU、内存或滚动帧率；大量固定背景仍有绘制成本。

## 兼容范围

仅匹配顶层 HTTP/HTTPS 文档。Chrome 内部页面、扩展商店、其他扩展页面、PDF 查看器等受限制页面无法生效。不进入 iframe、网站 Shadow DOM，不修改伪元素或原有背景图片。原生播放器全屏、顶层对话框和特殊组件不保证支持。

白底判断：RGB 通道至少 242，通道差最多 8，透明度至少 0.98，无已有背景图。默认透明根画布也处理。透明图片会自然透出底层渐变。纯媒体查询或复杂祖先选择器导致的背景变化未必立即识别，刷新可重新检测。网站 CSP 或更高优先级样式也可能限制效果。不能保证支持所有网页。

## 权限与隐私

- storage：保存本机设置和 hostname 开关。
- activeTab：点击扩展时读取当前 URL，显示网站开关和支持状态。
- HTTP/HTTPS content_scripts：自动识别背景，需授予相应网站访问权限。

不读取页面文字或输入内容、不截图、不上传、不统计追踪。全部脚本、样式和色值本地打包，无 CDN、远程脚本、AI、Canvas、WebGL 或外部服务。

## 开发与验证

Node.js 22 LTS：

```sh
npm ci
npm run build
npx playwright install chromium
npm test
npm run package
```

测试使用完整 Chromium，在独立临时配置目录加载真实扩展，完成后清理配置。可用 SOFTLENS_CHROMIUM_PATH 指定本机 Chromium 路径。Linux 首次安装浏览器可使用 `npx playwright install --with-deps chromium`。

测试包含白底识别、图片/文字保护、动态背景、16 套配色实际网页更新、持久化、键盘操作、弹窗尺寸和旧脚本提示。截图及安装 ZIP 位于 artifacts/。GitHub Actions 自动构建、测试、上传安装包；本地通过不代表远程 CI 已通过。

性能对比：将 SOFT_LENS_BASELINE 设为旧版 content.js 路径后运行 `node tests/performance.mjs`。

## 配色来源

新增渐变使用 [Radix Colors 3.0.0](https://github.com/radix-ui/colors) 和 [Open Color 1.9.1](https://github.com/yeun/open-color) 浅色色阶重新组合，并非上游提供的成套渐变。精确色阶与颜色见 palette-sources.json，MIT 许可原文随 dist/licenses/ 分发。上游库不作为运行时依赖。
