# 水墨：原片与渲染源码

- [完整成片页面](../../../drafts/ink-wash/opening/index.html)
- [场景代码](../../../drafts/ink-wash/opening/scene.js)
- [笔触代码](../../../drafts/ink-wash/opening/brush.js)
- [时间轴](../../../drafts/ink-wash/opening/timeline.js)
- [配乐代码](../../../drafts/ink-wash/opening/audio.py)
- [渲染入口](make.sh)

正式目录复用原有源码，发布直接采用已通过的 `ink-full.mp4`。从根目录运行 `bash styles/024-ink-wash/video/make.sh` 可重新生成副本；需已安装项目 Node / Playwright / Chromium、FFmpeg、Python / NumPy。原页面还需备齐 `public/fonts/fontsource/noto-serif-sc/{200,400,900}.css`、`geist-mono/400.css` 及这些样式引用的字形，可从对应官方 @fontsource 包安装，不连接个人浏览器。

图解可用 `python3 styles/024-ink-wash/images/make_svgs.py` 重建，需 fontTools 与项目 `public/fonts/NotoSansSC-{Regular,Bold}.otf`。

重渲结果受字体和环境影响，不能替代 `process/approved-master.json` 标记的审核原片。
