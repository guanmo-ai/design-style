<div align="center">

<!-- BEGIN WORK PREVIEWS -->
<!-- 由 npm run gallery:readme 根据 gallery/data/works.json 生成，请勿手动修改此区域。 -->
<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-004-memphis"><img src="styles/004-memphis/video/cover.jpg" width="240" alt="孟菲斯 Memphis 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-004-memphis"><b>孟菲斯</b></a><br />
      <sub>Memphis · 15 秒</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-003-constructivism"><img src="styles/003-constructivism/video/cover.jpg" width="240" alt="构成主义 Constructivism 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-003-constructivism"><b>构成主义</b></a><br />
      <sub>Constructivism · 15 秒</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-02-masonry"><img src="layouts/02-masonry/video/cover.jpg" width="240" alt="瀑布流布局 Masonry 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-02-masonry"><b>瀑布流布局</b></a><br />
      <sub>Masonry · 15 秒</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-002-swiss-style"><img src="styles/002-swiss-style/video/cover.jpg" width="240" alt="瑞士国际主义 Swiss Style 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-002-swiss-style"><b>瑞士国际主义</b></a><br />
      <sub>Swiss Style · 15 秒</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-01-bento-grid"><img src="layouts/01-bento-grid/video/cover.jpg" width="240" alt="便当盒布局 Bento Grid 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-01-bento-grid"><b>便当盒布局</b></a><br />
      <sub>Bento Grid · 15 秒</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <a href="https://guanmo-ai.github.io/design-style/#work-001-bauhaus"><img src="styles/001-bauhaus/video/cover.jpg" width="240" alt="包豪斯 Bauhaus 视频封面" /></a><br />
      <a href="https://guanmo-ai.github.io/design-style/#work-001-bauhaus"><b>包豪斯</b></a><br />
      <sub>Bauhaus · 15 秒</sub>
    </td>
  </tr>
</table>
<!-- END WORK PREVIEWS -->

# 每天一个设计风格 · Design Style

**面向设计师与 AI 的开源设计风格库。**

*Design references for humans and AI.*

每天拆解一种设计风格：15 秒动效短片、风格图、设计规则、AI 提示词与完整源码。
为你的创作提供灵感，为 AI 提供清晰的审美参考与设计约束。

内容分为「设计风格」与「布局方式」两个系列，统一展示短片、图解与实用规则。既可以认识包豪斯等视觉语言，也可以学习便当盒、杂志网格等信息排列方式。

by 观默 [@guanmo_ai](https://x.com/guanmo_ai)

[**打开网页画廊 →**](https://guanmo-ai.github.io/design-style/)

</div>

---

## 每一期都有什么

| | 内容 | 规格 | 源码 |
|---|---|---|---|
| 🎬 | **15 秒动效短片** | 1920×1080 · 60fps · 配乐与音效全部由代码合成 · 成片在 [Releases](https://github.com/guanmo-ai/design-style/releases) | `video/*.tsx`（[Remotion](https://www.remotion.dev)）· `audio/make_music.py` |
| 🖼 | **4 张风格图 / 布局图** | 1080×1350（X / 小红书竖图比例） | `images/*.svg`，手写 SVG，可直接改 |
| 🛠 | **制作过程** | 研究 → 令牌 → 风格图 → 分镜 → 改版 → 质检 → 发布，每一步怎么想、怎么做、踩了什么坑 | `PROCESS.md` · `process/`（联系表、时间轴等过程图） |
| 🧰 | **从 0 到 1**（003 起） | 用了哪些工具、按什么顺序、每一步敲什么命令、做到什么程度算过关；附开工提示词，照着做能复刻一期 | `MAKING.md` · `process/05-workflow.png` |
| 📐 | **风格指南 / 布局指南** | 历史 · 规则 · 色板 · 字体 · 版式 · 常见误区 · AI 提示词 | `README.md` |
| 🎨 | **设计令牌** | 同一份颜色 / 字体 / 线宽，视频、图片、网页共用 | `tokens.ts` · `tokens.css` · `tokens.json` |

> `images/preview/` 里的 SVG 已内嵌字体子集，在 GitHub 上点开就是最终效果。

## 目录

### 设计风格 · Style

| 期 | 风格 | 年代 | 一句话 | |
|:-:|---|---|---|---|
| **001** | [**包豪斯 Bauhaus**](styles/001-bauhaus) | 1919—1933 | 圆、方、三角 + 红黄蓝，把“好看”变成可以教的规则 | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/day-01) · [🛠 过程](styles/001-bauhaus/PROCESS.md) |
| **002** | [**瑞士国际主义 Swiss Style**](styles/002-swiss-style) | 1950—1970 | 一张网格、一种无衬线、一种红，把版面变成一道可以计算的题 | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/day-02) · [🛠 过程](styles/002-swiss-style/PROCESS.md) |
| **003** | [**构成主义 Constructivism**](styles/003-constructivism) | 1917—1932 | 一条斜线、一块红、一个大声的字：把轴转 30°，版面就开始往前冲 | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/day-03) · [🛠 过程](styles/003-constructivism/PROCESS.md) · [🧰 从 0 到 1](styles/003-constructivism/MAKING.md) |
| **004** | [**孟菲斯 Memphis**](styles/004-memphis) | 1980—1988 | 一块一色、描一圈黑边、再歪一点：让普通的东西，看起来“好玩” | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/day-04) · [🛠 过程](styles/004-memphis/PROCESS.md) · [🧰 从 0 到 1](styles/004-memphis/MAKING.md) |

### 布局方式 · Layout

| 期 | 布局 | 年代 | 一句话 | |
|:-:|---|---|---|---|
| **01** | [**便当盒布局 Bento Grid**](layouts/01-bento-grid) | 2020s— | 大小不一的圆角格子，一格一事，用面积告诉你谁最重要 | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/layout-01) · [🛠 过程](layouts/01-bento-grid/PROCESS.md) |
| **02** | [**瀑布流布局 Masonry**](layouts/02-masonry) | 2009— | 列宽固定、高度跟着内容走，每一张都落进最短的那一列 | [🎬 视频](https://github.com/guanmo-ai/design-style/releases/tag/layout-02) · [🛠 过程](layouts/02-masonry/PROCESS.md) |

计划中（顺序可能调整）：波普艺术 Pop Art · 装饰艺术 Art Deco · 新粗野主义网页 Neo-Brutalism · Y2K · 日式极简 …… 想看哪个，来 X 上告诉我。

## 本地运行

### 浏览网页画廊

网页画廊只展示本仓库已发布视频，支持搜索、按风格 / 布局筛选、视频播放、图片预览，以及站内阅读指南和制作过程。需要 Node.js 22.12+ 与已登录的 GitHub CLI；无需安装渲染依赖。

```bash
npm run gallery:setup
npm run gallery:sync
npm run gallery:build
npm run gallery:serve
```

打开 `http://127.0.0.1:4186`。添加下一期、检查与静态托管说明见 [网页画廊维护文档](docs/GALLERY.md)。

### 制作与渲染

需要 Node 18+、Python 3.10+、ffmpeg。

```bash
git clone https://github.com/guanmo-ai/design-style.git && cd design-style
npm install
npm run fonts                  # 下载开源字体到 public/fonts（Jost / JetBrains Mono / TeX Gyre Heros / Oswald / Fredoka / Inter / Geist Mono / Selawik / Instrument Serif / Noto Sans SC）
pip install numpy fonttools

npm run studio                 # 在浏览器里逐帧预览、改参数
npm run render:001             # 生成配乐 → 渲染 out/001-bauhaus.mp4
npx playwright install chromium
npm run images:001             # 生成图案 → 内嵌字体的 preview SVG + 2x PNG
npm run render:002             # 风格 002：生成配乐 → 渲染 out/002-swiss-style-master.mp4（带运动模糊，较慢）
npm run images:002             # 风格 002：生成 4 张风格图 → preview SVG + 2x PNG
npm run render:003             # 风格 003：生成配乐 → 渲染 out/003-constructivism-master.mp4（带运动模糊）
npm run images:003             # 风格 003：生成 4 张风格图 → preview SVG + 2x PNG
npm run render:004             # 风格 004：生成配乐 → 渲染 out/004-memphis-master.mp4（带运动模糊）
npm run images:004             # 风格 004：生成 4 张风格图 → preview SVG + 2x PNG
npm run render:L01             # 布局 01：生成配乐 → 渲染 out/01-bento-grid-master.mp4
npm run images:L01             # 布局 01：生成 4 张布局图 → preview SVG + 2x PNG
npm run render:L02             # 布局 02：生成配乐 → 渲染 out/02-masonry-master.mp4
npm run images:L02             # 布局 02：生成 4 张布局图 → preview SVG（内嵌字体和照片）+ 2x PNG

# 制作过程里的过程图
npx remotion bundle src/index.ts --out-dir out/bundle
node scripts/stills.mjs out/bundle out/check 164 224 314   # 只导出想检查的帧（COMP=L01-BentoGrid 换成布局 01）
python3 scripts/contact_sheet.py out/sheet.jpg --video out/001-bauhaus.mp4 "164|01 色彩" "224|02 形与色"
python3 scripts/timeline_chart.py styles/001-bauhaus/process/timeline.json public/001-bauhaus/music.wav out/timeline.png
```

## 目录结构

```
design-style/
├─ src/                    # Remotion 入口，每期注册一个 Composition：风格 S001-Bauhaus … / 布局 L01-BentoGrid …
│  └─ lib/                 # 通用动画工具（缓动 / 弹簧 / 关键帧轨道）与胶片颗粒
├─ styles/
│  └─ 001-bauhaus/
│     ├─ README.md         # 风格指南
│     ├─ PROCESS.md        # 制作过程（process/ 里是过程图）
│     ├─ tokens.{ts,css,json}
│     ├─ video/            # 15 秒短片：开场 + 9 个章节 + 九宫格回顾 + 片尾
│     ├─ audio/make_music.py
│     └─ images/           # poster / cheatsheet / app-ui / pattern(.py)
│        └─ preview/       # 内嵌字体、可直接分享的 SVG
│  └─ 002-swiss-style/     # 同上；短片：一张 12 × 6 网格贯穿全片，红色接力换幕
│  └─ 003-constructivism/  # 同上，另有 MAKING.md（从 0 到 1 的工具与流程）；短片：全片只有两条轴（−30° / 60°），形状接力换幕
│  └─ 004-memphis/         # 同上，含 MAKING.md；短片：每样东西都是“糖果色 + 黑描边 + 硬投影”的积木，掉下来、压扁、回弹，颜色接力换幕
├─ layouts/                # 布局：结构同 styles/，期号两位
│  └─ 01-bento-grid/
│     ├─ README.md         # 布局指南
│     ├─ PROCESS.md        # 制作过程（含 v1 → v2 改版）
│     ├─ tokens.{ts,css,json}  # 列数 · 间距 · 圆角 · 响应式
│     ├─ video/            # 15 秒短片：同一套卡片一路变形（发布会 → 来历 → 规则 → 用法）
│     ├─ audio/make_music.py
│     └─ images/           # poster / cheatsheet / skins / templates（make_svgs.py 生成）
  └─ 02-masonry/           # 同上；短片：26 张卡片在 13 种排法之间流动（落雨 → 砌石墙 → 算法 → Pinterest → 手机 → 规则 → 响应式）
├─ gallery/                # 网页画廊（静态站点源码与作品数据 works.json）
├─ scripts/                # 字体下载 · SVG → PNG · 关键帧截图 · 联系表 · 节拍时间轴
├─ docs/PROCESS_TEMPLATE.md # 每期制作过程的模板
└─ public/                 # 字体与生成的音频（不入库）；视频里用到的静态图与照片
```

## 统一规格

- **时长** 15 秒 = 900 帧 @ 60fps；所有转场都落在拍点上（包豪斯、瑞士风格 120 BPM，1 拍 = 30 帧；便当盒 150 BPM，1 拍 = 24 帧；瀑布流约 128.6 BPM，1 拍 = 28 帧）
- **结构** 钩子（0–2s）→ 6–9 个侧面章节（每章 1–1.5s：一个主角 + 一个动作 + 一行标签）→ 回顾 → 片尾
- **每期四件套** 视频 · 风格图 · 制作过程 · 源代码
- **风格图** 海报 · 速查卡 · 今天的应用 · 图案/纹理，四张一组
- **布局图** 海报 · 速查卡 · 布局 × 风格（或易混布局对照）· 拿来就用的模板，四张一组
- **字体** 只用可免费商用的开源字体（SIL OFL / GUST Font License）

## 授权

代码欢迎学习和改造；转发视频和图片请注明出处 **观默 @guanmo_ai**。
字体 Jost、JetBrains Mono、Inter、Geist Mono、Selawik、Instrument Serif、Noto Sans SC 均为 SIL Open Font License 1.1；TeX Gyre Heros 为 GUST Font License。
