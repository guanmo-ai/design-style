# 布局 03 · 分屏布局 · 从 0 到 1：这支视频是怎么做出来的

> [`PROCESS.md`](PROCESS.md) 写“怎么想”，这份写“怎么做”：工具、顺序、命令、过关标准。想照着做出一期，从这里开始。

🎬 [看成片](https://github.com/guanmo-ai/design-style/releases/tag/layout-03) · 📐 [布局指南](README.md) · 🛠 [制作过程](PROCESS.md)

## 0 · 先说结论

- **全部用代码做：** 画面是 React（Remotion），配乐是 Python（numpy），布局图是手写 SVG，没有任何手绘素材和外部音源；照片是 AI 生成的（沿用布局 02）。
- **谁做的：** 观默定方向、选三张候选里的一张、验收；Claude Code 负责研究、候选海报、全部代码和文档。观默的开工要求只有一句：“做一个新的布局方式，先给三张图选风格；对设计师有帮助，动效要非常顶尖；四张配图、制作过程都要有。”
- **为什么这样做：** 全部是文本文件，所以每一步都能 diff、能回退、能重新生成；动效是代码算出来的，改一个数字（比如换幕的落定帧）整支片子的音画对齐一起跟着走。
- **顺序：** 先三选一 → 研究 → 令牌 → 时间轴 → 舞台引擎 → 逐章做动效 → 配乐 → 图 → 渲染 → 质检 → 文档。动效优先：引擎和章节做完、质检过关，才写配乐和文档。

## 1 · 工具箱

| 环节 | 工具 | 版本 | 用来做什么 | 费用 |
|---|---|---|---|---|
| 动效 | [Remotion](https://www.remotion.dev) + React | 4.0.538 | 把 React 组件逐帧渲染成视频；`@remotion/motion-blur` 做运动模糊 | 免费（个人 / 小团队） |
| 配乐 | Python + numpy | 3.10+ | 从正弦波和噪声合成鼓、低音、拨弦、扫频 | 免费 |
| 响度 | ffmpeg `loudnorm` | 任意近版 | 标准化到 −14 LUFS | 免费 |
| 布局图 | 手写 SVG + fontTools + Playwright(Chromium) | — | 生成 SVG，子集化内嵌字体，导出 2x PNG | 免费 |
| 联系表 / 时间轴 | Pillow、matplotlib | — | 从成片抽帧拼联系表；画“剪辑点是否落在拍点上”的图 | 免费 |
| 字体 | Archivo、Noto Sans SC、Space Mono | — | 全部 OFL，不用买授权 | 免费 |

## 2 · 准备环境

```bash
git clone https://github.com/guanmo-ai/design-style.git && cd design-style
npm ci                                  # 自动打浏览器 ZIP 解压安全补丁
npm run fonts                           # 下载开源字体到 public/fonts
pip install numpy fonttools pillow matplotlib
npx playwright install chromium         # 导出布局图 PNG 用
```

> 受限网络（比如云端 AI 会话）里，`npm run fonts` 的 `github.com/.../raw/...` 可能返回 403，把脚本里的主机换成 `raw.githubusercontent.com` 即可（同一份文件）。Chromium 路径不同时，设 `CHROMIUM_PATH=/path/to/chromium`。

## 3 · 十步，从 0 到 1

### ① 三选一
- **做什么：** 先别做视频。把三个候选布局各画成一张 1080×1350 的海报，每张本身就是那种布局，视觉各不相同。
- **产出：** `drafts/layout-03/`（三张 SVG + `make_svgs.py`）。
- **过关标准：** 三张放在一起，一眼能分辨出三种布局和三种气质；每张都有一句话、三个颜色、一种字。

### ② 研究
- **做什么：** 列清单：来历（年份 + 事件）、五条规则（怎么做 / 小心）、广度清单（章节）、误区、CSS 现状。能算的数字自己算（对比度用 WCAG 公式）。
- **产出：** 写进 [`README.md`](README.md) §1—§7。
- **过关标准：** 每个年份都有出处可查；每条规则都有“小心”；对比度数值是算出来的。

### ③ 设计令牌
- **做什么：** 颜色、字体、中线位置、节拍，写成同一份。
- **产出：** `tokens.ts`（视频用）· `tokens.css`（网页用）· `tokens.json`（画廊读）。
- **过关标准：** 视频、图、文档里出现的颜色和数字都能在令牌里找到。

### ④ 时间轴
- **做什么：** 先写时间轴，再写代码。120 BPM、1 拍 = 30 帧；每章几拍；换幕落定帧 = 章节起点。
- **产出：** `process/timeline.json`（画廊和时间轴图读它）· `video/timeline.ts`（代码读它）。
- **过关标准：** `timeline_chart.py` 画出来，所有黄线（剪辑点）都落在灰线（拍点）上。

### ⑤ 舞台引擎
- **做什么：** 先不做章节，只做舞台：中线位置 / 角度两条轨道、每章画两遍再裁、反向传送带，用占位章节验证。
- **产出：** `video/SplitScreen.tsx` · `tracks.ts` · `ui.tsx`。
- **过关标准：** 用占位章节渲染换幕前后的几帧，左半向上、右半向下，落定帧正好在拍点。

```tsx
// 每一半各画整幅，再被中线裁开；θ 一变，左半变上半，章节组件不用改
clipPath: `polygon(${P(B, 0)}, ${P(-B, 0)}, ${P(-B, B)}, ${P(B, B)})`
```

### ⑥ 逐章做动效
- **做什么：** 一章一个文件（`intro / history / ratio / contrast / scroll / responsive / end`），每章一个“只此一份”的演示。每做完一章，只渲染它的几帧看。
- **产出：** `video/*.tsx`。
- **过关标准：** 每章的落定帧不是空的；文字不压文字；最快的一帧（有模糊）也读得出内容。

```bash
npx remotion bundle src/index.ts --out-dir out/bundle
COMP=L03-SplitScreen SCALE=0.4 PROPS='{"blur":1,"music":false}' \
  node scripts/stills.mjs out/bundle out/check 150 330 540 690 870 1050
# 或者一条命令：打包 + 抽帧 + 拼联系表（开发辅助）
scripts/l03_check.sh 150 330 540 690 870 1050
```

### ⑦ 配乐
- **做什么：** 先画一张“声音表”：每个画面事件对应什么声音、在哪一帧；再写代码。
- **产出：** `audio/make_music.py` → `public/03-split-screen/music.wav`。
- **过关标准：** 时长 20.0s；−14 LUFS；真峰值 ≤ −1 dBFS；频谱里能看到每个换幕的重击。

```bash
npm run music:L03
ffmpeg -i public/03-split-screen/music.wav -af ebur128=peak=true -f null - 2>&1 | tail -5
```

### ⑧ 布局图 ×4
- **做什么：** 海报、速查、对比、模板。先写 SVG 生成脚本，再用 `build_images.py` 内嵌字体和照片、导出 PNG。
- **产出：** `images/make_svgs.py` → `images/*.svg` · `images/preview/*.svg` · `images/png/*.png`。
- **过关标准：** 每张图用 PNG 看一遍：文字不出框、不叠字；标注和数值与令牌一致。

```bash
npm run images:L03
```

### ⑨ 渲染成片
- **做什么：** 带运动模糊（10 次采样）渲染母版；4 核机器约 6 分钟。
- **产出：** `out/03-split-screen-master.mp4`（约 9 MB）。
- **过关标准：** `ffprobe` 1920×1080 · 60fps · 1200 帧 · 20.0s；音画长度一致。

```bash
npm run render:L03        # 先合成配乐，再渲染
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration,nb_frames -of default=nw=1 out/03-split-screen-master.mp4
```

### ⑩ 质检与过程图
- **做什么：** 从成片按拍点抽帧拼联系表，逐拍看；再抽“动效分解”（拉链、换幕、转 90°）；画时间轴图。
- **产出：** `process/02-storyboard.jpg` · `03-motion.jpg` · `04-timeline.png`。
- **过关标准：** 逐拍看一遍没有空白落定、没有压字、没有跳变；时间轴图上剪辑点全在拍点。

```bash
python3 scripts/contact_sheet.py out/sheet.jpg --video out/03-split-screen-master.mp4 --cols 4 "0|开场" "150|来历" ...
python3 scripts/timeline_chart.py layouts/03-split-screen/process/timeline.json public/03-split-screen/music.wav layouts/03-split-screen/process/04-timeline.png
```

## 4 · 和 AI 一起做

**开工提示词（可以直接用）：**

```
你能看看这个项目，然后帮我做一个新的布局方式吗？做之前先给我三张图，我来选不同的风格。
做出来要对设计师有帮助，动效视频要做得好看，动效一定要非常顶尖。
选定之后：动效优先；四张配图、制作过程（PROCESS / MAKING）、中英文指南都要有；
沿用项目的约定（1920×1080 · 60fps、令牌、文档结构、画廊登记）。
```

**协作经验：**

- **让 AI 先出候选：** “先给三张图选”能把方向问题在最便宜的阶段解决；三张要各用一种视觉，不要只是配色不同。
- **让 AI 自己看帧：** 每改一章就渲染几帧、拼联系表、**用图像读取工具看**，问题（压字、空白落定、字号溢出）大多在这一步发现，不要等到整片渲染完。
- **整片只渲染两次：** 第一次看逐拍联系表挑问题，改完再渲染第二次；中间用静帧验证。
- **数字让 AI 算：** 对比度、缓动曲线到 98% 的帧数、每个音效的帧号，都让 AI 现算再写进文档，不要凭感觉。

## 5 · 投入与产出

| 项目 | 数量 |
|---|---|
| 视频源码 | 约 1,300 行（`video/` 11 个 .ts / .tsx 文件） |
| 配乐 | 约 530 行 Python（numpy，无外部音源） |
| 布局图 | 约 550 行 SVG 生成脚本 |
| 外部素材 | 照片沿用布局 02（AI 生成）；字体 3 个家族（OFL） |
| 渲染 | 1200 帧，运动模糊 10 次采样，4 核约 6 分钟 |
| 成片 | 约 9 MB（1080p60，H.264 crf 16 + AAC） |

## 6 · 文件地图

```
layouts/03-split-screen/
├─ README.md / README.en.md    # 布局指南（中 / 英）
├─ PROCESS.md / PROCESS.en.md  # 制作过程
├─ MAKING.md                   # 这份
├─ tokens.{ts,css,json}        # 设计令牌
├─ video/
│  ├─ SplitScreen.tsx          # 舞台：每章画两遍 → 中线裁开 → 反向传送带 → 运动模糊
│  ├─ tracks.ts                # 中线位置 xAt(f)、角度 thetaAt(f)：全片只有这两条轨道
│  ├─ timeline.ts              # 章节起点（帧）与传送带窗口
│  ├─ ui.tsx                   # 字体、章节页（视差）、遮罩出字、光标、数字滚轮
│  ├─ intro / history / ratio / contrast / scroll / responsive / end .tsx   # 七章
│  └─ cover.jpg                # 封面
├─ audio/make_music.py         # 配乐与音效（numpy）
├─ images/
│  ├─ make_svgs.py             # 4 张图的生成脚本
│  ├─ *.svg                    # 源文件（可读、可改）
│  ├─ preview/*.svg            # 内嵌字体子集与照片，GitHub 上点开就是最终效果
│  └─ png/*.png                # 2x 位图（2160×2700）
└─ process/                    # timeline.json · 联系表 · 动效分解 · 时间轴图
```
