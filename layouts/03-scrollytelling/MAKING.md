# 布局 03 · 滚动叙事 · 从 0 到 1：这支视频是怎么做出来的

> [`PROCESS.md`](PROCESS.md) 讲**设计上怎么想**：为什么这样选、哪里改过。这份讲**动手怎么做**：用了哪些工具、按什么顺序、每一步敲什么命令、做到什么程度才算过关。
> 照着这份做，可以从一个空文件夹做出同样规格的一期：15 秒 · 4K（3840×2160，另出 1080p）· 60fps 短片，加上 4 张布局图、指南和过程文档。

🎬 [看成片（Releases · layout-03）](https://github.com/guanmo-ai/design-style/releases/tag/layout-03) · 📐 [布局指南](README.md) · 🛠 [制作过程](PROCESS.md)

![从 0 到 1 的十步](process/05-workflow.png)

---

## 0 · 先说结论：这一期是怎么“做”的

- **全部是代码。** 没用 Figma、After Effects、Blender，也没用素材库、AI 生图或现成音乐。那台会拆开的 3D 手机是用 three.js 一行行代码建模、打光的（没有模型和贴图文件）。配乐 v1—v4 全由 numpy 合成；v5 为了“触动人心”换成了真乐器采样（[VSCO 2 CE](https://github.com/sgossner/VSCO-2-CE)，CC0 公共领域），但每一个音在哪一帧响、怎么混，仍然全是代码。改一个数字就能重出。
- **谁做的。** 这一期由 AI 智能体（Notion AI）在一台 Linux 沙盒里完成：读仓库、查资料、写代码、渲染、看图、改版、写文档。人负责定方向（“换成滚动叙事，先确认它真的是布局；要顶尖，视频动效要顶尖”）和审片——一共审了五版，v2—v5 的改动都来自审片意见（见 [`PROCESS.md` §13—§16](PROCESS.md#16--v5-改版清晰一拍一下真乐器)）。
- **为什么用代码做。** 滚动叙事本来就是“画面 = f(滚动位置)”。所以这一期**先做了一张真网页**（[`demo/index.html`](demo/index.html)），视频只是把它嵌进来、逐帧滚给你看：sticky、触发线、倒着滚、手机断点，全是浏览器真实的行为，而不是“看起来像”。
- **顺序。** 验证选题 → 文字 → 令牌 → **真网页** → 把网页嵌进视频 → 滚动曲线与镜头 → 声音 → 质检 → 图与发布。**先做出能用的东西，再决定怎么拍它。**

## 1 · 工具箱

| 环节 | 工具 | 版本（本期） | 用来做什么 | 费用 |
|---|---|---|---|---|
| 演示网页 | 原生 HTML / CSS / JS | — | `demo/index.html`：`position: sticky` + IntersectionObserver + 一个滚动回调；SVG 画城市和雪山，canvas 画 72 张图 | 免费 |
| 视频 | [Remotion](https://www.remotion.dev) + React + TypeScript | 4.0.454 | 用 React 组件写视频：网页嵌在 iframe 里，每一帧 = 网页滚到 Y(f) 的样子；`@remotion/fonts` 加载字体 | 个人与小团队免费（[许可](https://www.remotion.dev/license)） |
| 3D 手机 | [three.js](https://threejs.org)（WebGL） | 0.186 | 程序化建模（钛中框、背板、三摄、中板、电池、主板、屏幕、玻璃）+ 虚拟摄影棚环境反射，渲染成网页“逐帧”一段的 72 张图；无显卡时用软件 GL（`--gl=swangle`） | 免费（MIT） |
| 量网页 | [Playwright](https://playwright.dev) | — | 在 1440×900 / 390×844 下打开网页，读 `window.__anchors()` 量出每一步的滚动位置；截图检查 | 免费 |
| 运行环境 | Node.js · Python | 24 · 3.13 | Node 跑 Remotion 与截图脚本；Python 写图片、配乐、过程图 | 免费 |
| 布局图 | Python 手写 SVG · [fontTools](https://github.com/fonttools/fonttools) | — | 按公式输出 SVG；子集化字体后内嵌 | 免费 |
| 渲染图片 | Chromium | — | 把 SVG / HTML 渲染成 2x PNG；导出视频关键帧 | 免费 |
| 配乐 | numpy · [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE) | v5 | v1—v4 从零合成；v5 用 VSCO 2 CE 的真乐器采样（弦乐组长音 / 颤弓 / 跳弓、立式钢琴、竖琴、钟琴、圆号、定音鼓、大鼓、镲、锣），numpy 写采样器、编曲、混音、音效；首次运行按需下载到 `.cache/vsco/` | 免费（CC0） |
| 音视频处理 | [ffmpeg](https://ffmpeg.org) | 7.0 | 响度测量（loudnorm）、精确抽帧、压分享版 | 免费 |
| 过程图 | Pillow · matplotlib · ImageMagick | — | 联系表、修改前后、时间轴图 | 免费 |
| 字体 | [Inter / Inter Display](https://rsms.me/inter/) · [Geist Mono](https://vercel.com/font) · [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) · [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) | — | 产品页标题与正文、读数与代码、中文、2012 那一章的报纸衬线。都是 OFL，可商用 | 免费 |
| 版本管理 | git · GitHub | — | 一期一个分支；Release 放成片 | 免费 |

全部开源或免费，一台没有显卡的 2 核机器就能跑完整个流程（3D 手机走软件 GL，慢一些）。

## 2 · 准备环境（10 分钟）

```bash
git clone https://github.com/guanmo-ai/design-style.git && cd design-style
npm install                     # Remotion 等
npm run fonts                   # 字体下载到 public/fonts（不入库）
pip install numpy fonttools pillow matplotlib
export CHROMIUM_PATH=$(which chromium)   # 或 npx playwright install chromium
npm run studio                  # 浏览器里打开 L03-Scrollytelling，逐帧拖一遍确认环境可用
```

## 3 · 十步，从 0 到 1

每一步都写了：**做什么 → 产出 → 过关标准**。过关了再进下一步，返工最少。

### 01 · 读仓库，然后换题

- **做什么：** 通读布局 01、02 的 `README.md`、`PROCESS.md`、`tokens.*`、`video/`，和 [`docs/MAKING_TEMPLATE.md`](../../docs/MAKING_TEMPLATE.md)。本期先做了圣杯布局，审片没过（名字和画面都不够吸引人），整期放弃，换题。
- **产出：** 一份“这一期必须有什么”的清单 + 新选题。
- **过关：** 选题本身就让人想点开；新的一期放进目录里，和前两期并排看像一个系列。

### 02 · 验证它“真的是布局”

- **做什么：** 逐条对照：有没有**固定结构**（section · sticky 舞台 · 步骤 · 触发线）？有没有**有名字的排法**（并排 · 覆盖 · 逐帧 · 横移）？**换风格还成立吗**？有没有**规则**和**原生 CSS**？再写清楚它**不是什么**（视差、整屏翻页、劫持滚动）。
- **产出：** 指南 §0 的那张表，和 `PROCESS.md` §1。
- **过关：** 五项都答得上来；能用一句话说清“动画是舞台上演什么，布局是舞台放在哪、什么时候换”。

### 03 · 研究：只写查得到的

- **做什么：** 时间线（2012 Snow Fall → 2014 Bostock → 2017 Pudding / Scrollama / sticky → 2020 苹果 → 2023—2026 CSS）→ 五条规则（每条写“怎么做”和“小心”）→ 广度清单（新闻、数据、产品页、前端）→ 误区。浏览器版本直接查 MDN 的 [browser-compat-data](https://github.com/mdn/browser-compat-data)，不凭记忆。
- **产出：** `README.md` §1—§7 的草稿。广度清单直接变成视频的七章。
- **过关：** 每个人名、标题、日期、版本号都能对上原文或数据源（例如 Firefox 159 写作时还是 beta，就写明正式版日期）。

### 04 · 设计令牌

- **做什么：** 颜色（黑 + 一条渐变；蓝 = 钉住、粉 = 触发线）、字体、结构参数（section 高度、sticky、一步一屏、触发线 50%、并排 7fr : 5fr、< 768px 覆盖）、节拍（120 BPM = 30 帧一拍）。一份数值写进 `tokens.ts`（视频）、`tokens.css`（网页，附可直接用的完整滚动叙事）、`tokens.json`（画廊与 AI）。
- **过关：** 视频里的触发线、图里的触发线、CSS 里的 `rootMargin` 是同一个 50%。

### 05 · 先做一张真网页

- **做什么：** 一个文件 `demo/index.html`，三段滚动叙事各用一种排法：① 并排（舞台 7fr : 文字 5fr，城市里 160 个点 4 种状态）② 覆盖（雪山铺满、卡片浮上面，天色 3 种状态）③ 逐帧（420vh 的 section，按进度画第 `round(p × 71)` 张图）。结构三段共用：

  ```css
  .stage { position: sticky; top: 0; height: 100vh; }          /* 规则 01：钉住，不劫持 */
  .step  { min-height: 85vh; }                                   /* 一步约一屏 */
  @media (max-width: 767px) { .side .steps { margin-top: -100vh; } }  /* 规则 05：手机改覆盖 */
  ```
  ```js
  // 规则 03 / 04：触发线在视口 50%，过线后用 12% 屏高过渡；状态 = f(scrollY)，倒着滚就倒着变
  const c = steps.map(el => clamp((innerHeight * .5 - el.getBoundingClientRect().top) / (innerHeight * .12)));
  ```
- **给视频留接口（平时用不到）：** `?video` 关掉 CSS 动画和滚动条；`window.__frame(y)` 同步画出第 y 像素那一帧；`window.__ready` 等字体和 72 张图加载完；`window.__anchors()` 返回各段的滚动位置；`?layer=steps&vh=900` 只留文字层、把 1vh 钉成 9px（文字层的 iframe 比一屏高）。
- **产出：** `demo/index.html` + `demo/spin/`（`video/PhoneSpin.tsx` 渲染的 72 张 webp，共约 570KB）。
- **过关：** 电脑和手机各打开一次，往下滚、往回滚都对；Playwright 在 1440×900 / 390×844 下截图检查每一步。

### 06 · 把网页嵌进视频

- **做什么：** `npm run demo:L03` 把网页拷到 `public/`；`video/Web.tsx` 用一个同源 iframe 加载它，`delayRender` 等到 `__ready`，之后每一帧：

  ```ts
  el.getBoundingClientRect();            // 先让父页面排版，iframe 的视口尺寸才会更新
  for (const [k, v] of Object.entries(vars)) win.document.documentElement.style.setProperty(k, v);
  win.__frame(y);                        // 网页滚到 y，并同步画好这一帧
  ```
  iframe 的宽高就是浏览器视口：宽度从 1440 拉到 390，网页里真实的 `@media` 就会生效。
- **X 光：** 主 iframe 做舞台层（`--steps-op` 淡掉文字、`--page-bg` 把底变成玻璃、`translateZ(300px)` 抬起来），第二个 iframe `?layer=steps` 只留文字层，按 Y 跟着滚；两层之间立一道粉色光幕（`rotateX(90deg)` 的渐变面）。
- **产出：** `video/Web.tsx`、`video/Device.tsx`（浏览器 ⇄ 手机外壳连续变形）。
- **过关：** 视频里任意一帧，和用浏览器打开网页滚到同一位置的截图一致。

### 07 · 滚动曲线与镜头：先写 Y(f)

- **做什么：** `video/page.ts` 里 16 次滑动拼成主设备的滚动曲线，每次从上一下此刻的位置接着走（可以打断、可以倒着滚）；变手机之后改用“步数”表示，宽度一变，scrollY 按网页公式跟着变：

  ```ts
  // [起始帧, 目标 scrollY, 时长, 缓动]；每次滑动从拍点开始
  for (const [at, to, d, e = 'out'] of FLICKS) { if (f < at) break; v = v + (to - v) * EASE[e](Math.min(1, (f - at) / d)); }
  ```
  镜头是设备的位姿 `{cx, cy, k, rx, ry, rz, z}`：开场飞入、X 光斜过来、逐帧推近、变手机、片尾让位；`project()` 用和 CSS 同一套矩阵把 3D 点投到屏幕上，X 光里的标签就贴在舞台、触发线、视口的角上。
- **产出：** `video/page.ts`（`FLICKS`、`CROSS` 过线帧、`MORPH`、`BREAK_AT`、位姿）+ `process/timeline-v5.json`。
- **过关：** 每次滑动都从拍点或半拍起手，跨段的快甩正好在拍点上停住；过线、断点都有一声；要读的段落镜头不动。v5 的教训：**“一拍一下”比“匀速慢滚”更好看**——匀速看起来像在拖。

### 08 · 配乐与音效：从 page.ts 读滑动表

- **做什么：** v5 起乐器是真采样：脚本按需从 VSCO 2 CE 下载几十个 wav 到 `.cache/vsco/`，自己写一个小采样器（按 RMS 统一响度、按需移调、按力度挑采样层）。`audio/make_music.py` 用正则读出 `page.ts` 里的 `FLICKS`、`XRAY`、`MORPH`、`STEP_FLICKS`，用同一条贝塞尔缓动重算 Y(f)，算出过线帧和断点帧，再按滚动生成声音：

  ```python
  # 滚动的空气声：响度、亮度都跟着 Y(f) 的速度走
  sp  = np.interp(tA * 60 * FINE, np.arange(len(SPEED)), SPEED)   # 每个采样点的滚动速度（px/帧）
  spn = np.clip(sp / 140, 0, 1.6)
  air = stft_filter(noise, lambda tc: 600 + 5200 * clip(speed(tc) / 140), mode='bp')  # 越快越亮
  air *= spn ** 0.9 * 0.05                                           # 越快越响
  ```
  一条旋律贯穿全片：① 每一步过线一个旋律音、② 假终止落到 b 小调、③ 每转一下旋律上一级；X 光倒着滚 → 倒放的钢琴音；跨段快甩 → 倒放镲 + 定音鼓；过 768px 断点全片最重的一击（大鼓 + 定音鼓 + 锣 + 圆号 + 全体弦乐）；最后 ffmpeg 两遍 loudnorm 到 **−14 LUFS**。
  ```bash
  npm run music:L03   # → public/03-scrollytelling/music.wav（首次下载采样约 1 分钟，之后约 30 秒）
  ```
- **过关：** 改一下 `FLICKS`，重跑配乐，声音自动跟上；**要有人戴耳机听一遍。**

### 09 · 质检循环：看 → 改 → 再看

不整片重渲，只看受影响的几帧：

```bash
npx remotion bundle src/index.ts --out-dir out/bundle                     # 打包一次
COMP=L03-Scrollytelling PROPS='{"music":false}' \
  node scripts/stills.mjs out/bundle out/check 0 88 250 700              # 几秒到几十秒出这几帧
python3 scripts/contact_sheet.py out/sheet.jpg --cols 4 \
  "out/check/f000.png|f000" "out/check/f250.png|f250 X 光" ...             # 拼成一张图看
```

- **每次滑动必看速度最快的那一帧。** v1 首帧被运动模糊糊掉、X 光标签挤在一起、规则眉题被卡片盖住，都是在这样的帧里发现的（见 [`PROCESS.md` §9](PROCESS.md#9--自查与修改v1)）。
- **静帧看不出节奏，要看成片。** v3 的两条反馈（开场那根线、结尾太乱）在单帧里都“没问题”，放成视频才明显——每一版都要整片看一遍，最好请人看。
- **3D 要看全分辨率。** 半分辨率预览会把锯齿和发灰的金属藏起来，打光和材质至少要在 1920×1080 下看开场、拆开、X 光三处。
- **清晰度是工程问题，要一项项查。** v4 “不清晰”的原因有四个，单看哪一帧都“还行”：运动模糊加在了钉住的舞台上、胶片颗粒吃码率、Remotion 默认 JPEG 80 截帧、72 张图分辨率太低。v5 逐项改掉，再按 2× 渲染。
- 成片出来后：`contact_sheet.py --video` 精确抽帧做联系表，`timeline_chart.py` 叠上配乐波形检查切换点是否落在拍子上，`ffprobe` 核对规格。

### 10 · 图与发布

```bash
npm run images:L03                         # 4 张布局图 → preview/*.svg（内嵌字体）+ png/*.png（2x）
npm run music:L03                          # 配乐
npm run render:L03 -- --gl=swangle --concurrency=2   # 4K 母版（--scale=2 --jpeg-quality=100）：out/03-scrollytelling-master.mp4
# 机器慢、容易超时就分段：--frames=0-149 --muted …… 共 6 段，ffmpeg concat 无损拼接后再混入 music.wav
ffmpeg -i out/03-scrollytelling-master.mp4 -vf "scale=1920:1080:flags=lanczos:in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -c:a aac -b:a 256k -movflags +faststart \
  out/03-scrollytelling.mp4                # 1080p 分享版（4K 分享版去掉 scale 尺寸、crf 17、-level 5.1）
chromium --headless --no-sandbox --hide-scrollbars --window-size=1920,1200 \
  --screenshot=process/05-workflow.png process/05-workflow.html   # 本文顶部的流程图（在本期目录下运行）
```

1. 封面：取第 88 帧（片名 + 3D 手机）→ `video/cover.jpg`。
2. 过程图：分镜联系表、X 光拆解、v1 修改前后、时间轴、十步流程、v1 · v2 · v3 对比、v4 / v5 分镜与时间轴 → `process/`。
3. 提交：一期一个分支，视频不进 git。
4. Release：tag `layout-03`，上传 `03-scrollytelling.mp4`，正文附 SHA-256。
5. 画廊：向 `gallery/data/works.json` 添加条目（SHA-256 与 Release 一致），运行 `npm run gallery:readme`、`gallery:test`、`gallery:build`、`gallery:check`。

## 4 · 和 AI 一起做：开工提示词

这一期就是由 AI 智能体做的。想让 AI 帮你做下一期布局，可以从这段开始（把布局名换掉）：

```text
你在 design-style 仓库里做布局 NN：「布局名」。
1. 先读 layouts/ 下往期的 README.md、PROCESS.md、MAKING.md 和 docs/ 下的模板，列出每期必须有的产出。
2. 先验证它是布局而不是风格或特效：固定结构、有名字的排法、与风格无关、可执行的规则、原生 CSS。写不出来就换题。
3. 研究：时间线（只写能查证的，浏览器版本查 MDN browser-compat-data）、五条规则（怎么做 / 小心）、广度清单、误区。
4. 找到这一期的唯一变量（滚动叙事是 scrollY），所有画面都写成它的函数；先写这条曲线和 timeline.json，每个动作最快的一刻落在拍点上。
5. tokens.ts / .css / .json 用同一套数值；tokens.css 要附一段可直接用的代码。
6. 配乐用代码编排（numpy；要真乐器质感就用 CC0 采样，例如 VSCO 2 CE），写一条贯穿的旋律，音效和音符的时间点直接从视频源码里解析，不手抄；响度 −14 LUFS。
7. 每改一处只导出受影响的帧检查，速度最快的那一帧必看；把改版记录写进 PROCESS.md。
8. 交付：母版 + 分享版 MP4、封面、4 张 1080×1350 布局图、process/ 过程图、README / PROCESS / MAKING 三份文档、gallery 条目。
```

**和 AI 协作的经验：**
- **先问“它算不算”，再问“怎么做”。** 让 AI 先写出“为什么它是布局”的论证，比直接开工省下一整期——圣杯布局就是做完才发现选题不对。
- **让 AI 看图，而不是只看代码。** 每一轮都导出截图让它自己检查；本期三处动效问题全是“看图”发现的，代码本身都“没有错”。
- **给数字，不给形容词。** “滚得自然一点”不如“ease-out `bezier(0.12, 0.82, 0.24, 1)`，起手最快、30 帧滑停”；“标签别挤”不如“读数区固定宽度、不换行”。
- **一份数据，多处使用。** 画面、配乐、时间轴图都从 `page.ts` 读，AI 改一处，三处一起对。
- **先做真东西，再拍。** v1—v3 在视频里画了一张“示意网页”，审片一句“实际效果呢？”就问住了；v4 先花时间把 `demo/index.html` 做成能用的网页，视频反而更简单、更有说服力。教一个交互布局，最好的素材就是这个布局本身。
- **节奏比速度重要。** v4 中段的长滑和匀速慢滚“没有错”，看着却拖；片尾一拍一下的两次滑动反而被夸。v5 把它推广到全片：跨段快甩、章内一拍一下。
- **“炫”和“讲”分开。** v2 想把每一秒都做得很炫，结尾连续快甩 + 倒带，反而看着像出错；v3 把炫留给换章，章内匀速慢滚、逐条点亮，观众才记得住。告诉 AI “这一段要让人读完五条规则”，比“做得更高级”有用。

## 5 · 投入与产出

| 项 | 数字 |
|---|---|
| 源码 | 演示网页 1 个 HTML 约 370 行（不依赖任何库）· 视频约 1,550 行 TS（其中 3D 手机约 600 行，只用来生成网页里那 72 张转圈图）· 配乐约 780 行 Python · 布局图约 450 行 Python |
| 变量 | 全片 1 个：网页的 `scrollY = Y(f)`；16 次滑动 + 手机里 2 次，真网页 12 548px（电脑 1440×900）/ 12 194px（手机 390×844） |
| 外部素材 | 画面 0（没有照片、没有 3D 模型、没有 AI 生图）；声音：v5 起用 CC0 真乐器采样（VSCO 2 CE，运行时按需下载 103 个 wav、约 220MB 到 `.cache/`，不进仓库） |
| 整片渲染 | 2 核无显卡机器约 48 分钟（4K，`--scale=2`；分 6 段渲染再拼接，`--gl=swangle --concurrency=2`；X 光一段最慢，约 11.5 分钟）；配乐约 30 秒（首次另需下载采样） |
| 成片 | 4K 母版约 26MB · 4K 分享版约 15MB · 1080p 分享版约 7MB（3840×2160 / 1920×1080 · 60fps · −14 LUFS） |
| 版本 | 4 版（v1 → v2 按苹果发布会重做 → v3 按审片意见精修 → v4 先做真网页、片子改成拍它） |

## 6 · 文件地图

```
layouts/03-scrollytelling/
├─ README.md        # 布局指南：为什么算布局 · 来历 · 规则 · 色板 · 字体 · 参数 · 误区 · 提示词 · 分镜
├─ PROCESS.md       # 制作过程：怎么想、哪里改过
├─ MAKING.md        # 本文：用什么工具、按什么顺序、敲什么命令
├─ tokens.{ts,css,json}
├─ demo/            # 真网页演示 index.html + spin/ 72 张图（视频的主角）
├─ video/           # Remotion 源码（page.ts 是时间线，Web.tsx 把网页嵌进来）+ cover.jpg
├─ audio/make_music.py
├─ images/          # make_svgs.py → *.svg → preview/（内嵌字体）→ png/（2x）
└─ process/         # 01 分镜 · 02 X 光拆解 · 03 v1 修改前后 · 04 时间轴 · 05 本文流程图（.html 源文件可改）· 06 v1 · v2 · v3 对比 · 07 / 08 v4 分镜与时间轴 · 09 / 10 v5 分镜与时间轴
```
