# Design Style 网页画廊

静态画廊只展示本仓库的已发布短片。作品包含两个系列：**设计风格**（`styles/`）与**布局方式**（`layouts/`）。首页统一展示作品，卡片尺寸沿用原画廊：桌面四列，≤1050px 三列、≤800px 两列、≤600px 单列，以相同的标签样式区分系列，支持搜索与「全部 / 设计风格 / 布局方式」标签筛选。点击卡片进入作品详情后，展示视频、风格图片或布局图片，以及指南、过程与源码入口；图片可继续放大或下载 SVG，关闭图片后返回原作品详情。风格指南（布局为「布局指南」）和制作过程在站内独立阅读页打开，支持章节目录、文档切换、表格横向滚动与返回作品；源代码入口链接 GitHub。

## 本地预览

网站提供「中文 / EN」切换。语言优先级为 URL `?lang=zh` / `?lang=en`、已保存的选择、浏览器首选语言（中文用中文，其他语言用英文）。切换保留当前搜索、系列筛选与作品直达链接；详情内切换语言不重建播放器。`localStorage` 不可用时仍可通过语言链接浏览。

界面文案集中在 `gallery/assets/i18n.mjs`；每期在 `works.json` 中同时维护 `titleEn`、`descriptionEn`、`categoryEn`、`tagsEn`，以及每张图的 `titleEn` / `kindEn`。搜索同时匹配两种语言。英文内容缺失时目录验证失败。

需要 Node.js 22.12+、已登录的 GitHub CLI。只安装 `gallery/` 内独立的 Markdown 构建依赖，无需安装 Remotion 或重新渲染短片。

```bash
npm run gallery:setup   # 首次安装文档构建依赖；使用锁文件，不执行安装脚本
npm run gallery:sync    # 读取本仓库 Releases，下载并校验视频，同步 README 预览
npm run gallery:readme  # 仅按作品目录更新 README 预览，无需下载视频
npm run gallery:build   # 生成独立静态站点 dist/
npm run gallery:serve   # http://127.0.0.1:4186
npm run gallery:test    # 目录、筛选、路径边界与视频 Range 请求测试
npm run gallery:check   # 构建后检查发布文件、Pages 子路径链接、锚点与媒体哈希
```

阅读页从每期现有 `README.md` 与 `PROCESS.md` 构建到 `dist/read/<作品 ID>/`。无需另写网页正文。构建时处理 Markdown、清理不安全 HTML，并校验与复制文档引用的本期图片；两份文档之间的相对链接和章节锚点转换为站内链接。其他源码链接保留 GitHub 入口。

英文阅读页从每期 `README.en.md`（英文简明指南）与 `PROCESS.en.md`（英文制作概览）构建为 `guide.en.html` / `process.en.html`，提供双向语言切换、英文目录与返回作品入口。英文概览注明其与详细中文原文的关系；现有视频、图解及过程图保留原版中文标注，不把它们描述为已翻译媒体。根目录 `README.md` 与 `README.en.md` 均提供语言入口，`gallery:readme` 同时更新两份预览表。

审阅尚未发布的视频改版时，先运行 `npm run render:L01`，再运行 `npm run gallery:preview -- 01-bento-grid out/01-bento-grid-master.mp4`，最后启动 `npm run gallery:serve`。预览命令检查本地视频规格，先构建并检查正式产物，再用本地视频替换预览副本并记录其 SHA-256；不会修改 Release 缓存或源目录中的发布哈希。该预览产物不能直接发布，`gallery:check` 会拒绝其与正式目录的差异。重新运行 `gallery:build` 即恢复使用已发布视频。

构建产物 `dist/` 用于静态托管，全部资源用相对路径，支持 `/design-style/` 子路径。本地构建和预览不自动推送。只部署 `dist/`，不把项目根目录作为站点目录。

## GitHub Pages

地址：<https://guanmo-ai.github.io/design-style/>。

`.github/workflows/pages.yml` 在推送 `main` 或手动触发时运行：安装锁定依赖 → 测试 → 下载本仓库 Release 视频并核验 → 构建 → 发布产物检查 → 部署 Pages。构建失败时不部署。Actions 仅在部署任务中授予 Pages 与 OIDC 写权限，第三方 Action 固定到提交 SHA。

首次需将仓库 Pages 的发布来源设为 GitHub Actions。后续更新内容并推送 `main` 即自动部署；应等待工作流完成，并核对线上首页、视频和站内阅读页。当前视频随站点同源发布，站点总大小受 [GitHub Pages 的 1 GB 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)约束，发布检查会在超限时停止。

视频缓存在 `.gallery-cache/`，不进入 Git。构建将已校验视频复制到 `dist/media/`，浏览器同源播放；本地服务器支持 HTTP Range，便于拖动播放进度。下载不成功或校验不一致时停止构建，不把不可播放的条目当作成功。

## 添加下一期

1. 完成本期目录：风格为 `styles/NNN-name/`（三位期号），布局为 `layouts/NN-name/`（两位期号）。内含封面 `video/cover.jpg`、风格图或布局图 `images/preview/*.svg` 及对应源文件、中英文 `README.md` / `README.en.md`、`PROCESS.md` / `PROCESS.en.md`、`tokens.json`、`process/timeline.json`。
2. 在本仓库 Release 发布成片。视频名与目录名一致：风格 `NNN-name.mp4`，布局 `NN-name.mp4`；Release tag 现有 `day-01`（风格 001）与 `layout-01`（布局 01）。
3. 向 `gallery/data/works.json` 添加条目，填写类型 `type`（`style` 或 `layout`，缺省按 `style`）、期号、标题、分类、简介、标签、发布日期、Release tag、视频文件名、SHA-256 与四张图的信息。SHA-256 可由 `gh release view <tag> --repo guanmo-ai/design-style --json assets` 返回的 digest 核对。
4. 运行同步、测试、构建并进行浏览器检查。视频规格与章节自动读取本期 tokens 和 timeline，不重复手填。`gallery:sync` 同时更新仓库首页的紧凑视频预览：按最新发布排序，每行最多三张，新增作品自动换行；封面与标题均链接到对应作品的画廊详情。只更新 README 时运行 `npm run gallery:readme`，将生成的 README 改动一并提交。

作品直达链接格式：`?q=包豪斯#work-001-bauhaus`；只看布局：`?type=layout`（只看风格：`?type=style`），可与 `q` 组合；首页始终按最新发布排序，旧链接中的 `category`、`sort` 不再影响首页展示。没有匹配时显示空状态，不展示尚未发布的预告作品。每一期的风格图或布局图只在对应作品详情中展示，首页不展示具体图片或制作资料。

影片详情复用本地 Awesome AI Motion 的顶部导航布局与按钮样式：「← 上一条」「当前位置 / 筛选总数」「下一条 →」，右侧保留关闭按钮，窄屏隐藏左侧作品标签以留出导航空间。点击按钮或按键盘左右方向键，沿首页当前筛选、搜索结果的显示顺序循环浏览；「全部」包含风格与布局，单个系列只在该系列内切换，位置计数随当前筛选更新。切换后从头播放，并更新标题、图解和直达链接，关闭后焦点回到最初打开的作品卡片。只有一部影片或直达影片不在当前筛选中时，切换按钮禁用。方向键交互参考 Awesome AI Motion：一次按键切换一部，忽略长按重复、输入法组合、组合键和已处理的事件；图片预览、全屏或画中画打开时不切换影片，视频控件聚焦时保留其原生方向键操作。

## 复用范围

仅复用 Awesome AI Motion 的视觉基础和字体，许可见 `gallery/NOTICE.md`。没有复制其案例库、采集流程、本地管理接口和发布配置。原 Remotion 项目、渲染脚本和媒体源文件保持独立。
