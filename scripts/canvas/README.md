# Canvas 逐帧渲染

从已审核的 020 / 021 制作工具迁入；使用 Playwright 自带 Chromium 和临时浏览器上下文，不读取个人浏览器配置。

- `film.cjs <page.html> <frames-dir> <start> <end> [parallel=3]`：调用页面 `window.frame(f)`，导出左闭右开的帧区间。
- `still.cjs <page.html> <frame> <out.png>`：导出一张 1920×1080 静帧。
- `events.cjs <page.html> <out.json>`：手动导出当前环境的动作事件。

页面用 `window.ready = true` 表示字体、图形与事件初始化完成。正式入口为各期 `video/make.sh`，配乐共用 `scripts/lib/audio/song.py`。

定稿音轨使用各期 `video/events.json`，默认不重新导出。字体版本与浏览器的文本栅格可能改变字符遮罩，从而改变事件数量；需要修改设计时再主动导出并重新审片。正式发布保留已审核 MP4 的准确字节。
