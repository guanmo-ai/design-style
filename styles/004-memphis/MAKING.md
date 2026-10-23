# 004 · 孟菲斯 · 从 0 到 1：这支视频是怎么做出来的

> [`PROCESS.md`](PROCESS.md) 讲**设计上怎么想**：为什么这样选、哪里推翻重来。这份讲**动手怎么做**：用了哪些工具、按什么顺序、每一步敲什么命令、做到什么程度才算过关。
> 照着这份做，可以从一个空文件夹做出同样规格的一期：15 秒 · 1920×1080 · 60fps 短片，加上 4 张风格图、指南和过程文档。

🎬 [看成片（Releases · day-04）](https://github.com/guanmo-ai/design-style/releases/tag/day-04) · 📐 [风格指南](README.md) · 🛠 [制作过程](PROCESS.md) · 📦 源码包：Release 附件 `004-memphis-source.zip`

![从 0 到 1 的十步](process/05-workflow.png)

---

## 0 · 先说结论：这一期是怎么“做”的

- **全部是代码。** 没用 Figma、After Effects、Premiere，也没用素材库、AI 生图或现成音乐。每块积木、每个字母、每一帧动画、每一声“咚”都由仓库里的源码生成，改一个数字就能重出。
- **谁做的。** 这一期由 AI 智能体（Notion AI）在一台 Linux 沙盒里完成：读仓库、查资料、写代码、渲染、看图、改版、写文档。人负责定方向、审片（本期第一轮审片改了台灯光束和开场字标）和最终确认发布。
- **为什么用代码做。** ① 可复现：别人 `git clone` 下来就能重出一模一样的成片；② 可精确：描边 5、投影 10、压扁 0.24、一拍 30 帧，全都是写死的数字；③ 可迭代：改一处只重渲那几帧，几秒钟就能看到结果；④ 可恢复：本期做到一半沙盒回滚、未提交的文件全部丢失，靠重放命令把一切原样找了回来（重新生成的四张图和审过的版本逐像素一致）。
- **顺序。** 文字 → 令牌 → 静态图 → 时间轴 → 动画 → 声音 → 质检 → 发布。**先把静止的画面做对，再让它动。**

## 1 · 工具箱

| 环节 | 工具 | 版本（本期） | 用来做什么 | 费用 |
|---|---|---|---|---|
| 视频 | [Remotion](https://www.remotion.dev) + React + TypeScript | 4.0.454 | 用 React 组件写视频：每一帧都是 `frame → 画面` 的函数；整片画在一张 1920×1080 的 SVG 上；`@remotion/motion-blur` 做运动模糊，`@remotion/fonts` 加载字体 | 个人与小团队免费（[许可](https://www.remotion.dev/license)） |
| 运行环境 | Node.js · Python | 24 · 3.13 | Node 跑 Remotion 与截图脚本；Python 写图片、配乐、过程图 | 免费 |
| 风格图 | Python 手写 SVG · [fontTools](https://github.com/fonttools/fonttools) | — | 按公式输出 SVG；用真实字体度量算字宽（`instancer` 先实例化可变字体）；子集化字体后内嵌进 SVG | 免费 |
| 渲染图片 | Playwright + Chromium | — | 把 SVG 渲染成 2x PNG；导出视频关键帧；把流程图 HTML 截成 PNG | 免费 |
| 配乐 | numpy | — | 从零合成底鼓、合成贝斯、琶音、方波主旋律、牛铃，以及“咚”“嘣”“嘀”、气泡音、滑哨、唱针、马林巴……没有任何外部音源 | 免费 |
| 音视频处理 | [ffmpeg](https://ffmpeg.org) | 7.0 | 响度测量（loudnorm）、精确抽帧、封面、压分享版 | 免费 |
| 过程图 | Pillow · matplotlib · ImageMagick | — | 联系表、时间轴图、拼图、缩略图比对（`magick compare`） | 免费 |
| 字体 | [Fredoka](https://fonts.google.com/specimen/Fredoka) · [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) · [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | — | 圆头几何西文；中文黑体；等宽标注。都是 OFL，可商用 | 免费 |
| 版本管理 | git · GitHub | — | 一期一个分支；视频与源码包放 Releases；画廊由 GitHub Pages 自动发布 | 免费 |

全部开源或免费，一台没有显卡的 2 核机器就能跑完整个流程。

## 2 · 准备环境（10 分钟）

```bash
git clone https://github.com/guanmo-ai/design-style.git && cd design-style
npm install                     # Remotion 等
npm run fonts                   # 字体下载到 public/fonts（不入库；本期新增 Fredoka）
pip install numpy fonttools pillow matplotlib
npx playwright install chromium # 或用系统 Chromium：export CHROMIUM_PATH=$(which chromium)
npm run studio                  # 浏览器里逐帧预览，确认环境可用（选 S004-Memphis）
```

## 3 · 十步，从 0 到 1

每一步都写了：**做什么 → 产出 → 过关标准**。过关了再进下一步，返工最少。

### 01 · 读仓库（抄结构，不抄画面）

- **做什么：** 通读 001—003 的 `README.md`、`PROCESS.md`、`MAKING.md`、`tokens.*`、`video/` 和 [`docs/PROCESS_TEMPLATE.md`](../../docs/PROCESS_TEMPLATE.md)、[`docs/GALLERY.md`](../../docs/GALLERY.md)。列出每期都有的东西：15 秒 / 60fps / 一整首配乐 / 4 张 1080×1350 图 / 统一的页眉页脚 / 指南 10 节 / 过程文档。
- **产出：** 一份“这一期必须有什么”的清单。
- **过关：** 新的一期放进目录里，和前几期并排看像是一个系列。

### 02 · 选题与“最有用的一招”

- **做什么：** 在计划列表里选下一个；写出一句话定义，再写出**这一期观众能带走的一招**。本期是：*一块一色，描一圈黑边，再歪一点。*
- **产出：** 写在 `PROCESS.md` §1 的三行字。
- **过关：** 后面每一个画面、每一张图，都能回答“它在演示哪一招”。答不上来的画面删掉。

### 03 · 研究：先列清单，再动手

- **做什么：** 时间线（只写查得到的年份；本期特别区分了**成立 1980.12** 和**首展 1981.9**）→ 3—5 条可执行的规则（每条写“怎么做”和“小心”）→ **广度清单**：名字的来历、书架、台灯、椅子、塑料贴面纹样、今天 → 常见误区。
- **产出：** `README.md` §1—§7 的草稿。广度清单直接变成视频的六章。
- **过关：** 每个人名、作品名、年份都能对上来源。

### 04 · 设计令牌：先定“系统”，再画画面

- **做什么：** 颜色（含面积比例）、字体、描边与硬投影、三档歪的角度、压扁系数、节拍。一份数值写进 `tokens.ts`（视频用）、`tokens.css`（网页用）、`tokens.json`（画廊与 AI 用）。
- **关键代码：** 每样东西都是同一块“积木”——先画投影，再画颜色和黑边：

  ```tsx
  // video/ui.tsx：一块积木 = 硬投影 → 糖果色 → 纹样（可选）→ 黑描边
  export const Blk = ({d, fill, sw = LINE.outline, sh = SHADOW.dx, pat, o}) => (
    <g opacity={o}>
      {sh > 0 && <path d={d} fill={C.ink} transform={`translate(${sh} ${sh})`} />}
      <path d={d} fill={fill} />
      {pat && <path d={d} fill={`url(#${pat})`} />}
      {sw > 0 && <path d={d} fill="none" stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />}
    </g>
  );
  ```
- **过关：** 画面上没有一个数字是“目测”的。

### 05 · 风格图先行（先把静止的画面做对）

- **做什么：** `images/make_svgs.py` 一次生成 4 张 SVG（海报 · 速查卡 · 习惯打卡 app · 四步改造）→ `scripts/build_images.py` 子集化字体、内嵌进 `preview/*.svg` → Chromium 渲染 2x PNG。
  ```bash
  npm run images:004
  ```
- **要点：** Fredoka 是可变字体（字重 + 字宽两个轴），**先 instancer 实例化到要用的字重、字宽 100 再量**：
  ```python
  f = instancer.instantiateVariableFont(TTFont('public/fonts/Fredoka.ttf'), {'wght': 700, 'wdth': 100})
  ```
- **过关：** 缩小到 900px 看，颜色一块一种、主角只有一个；放大到 2x 看，没有溢出、投影没有被裁。这几张图就是视频的“定帧”，视频里的手机界面直接从 app 概念图搬过来。

### 06 · 时间轴：先写节拍，再写动画

- **做什么：** 先定 BPM，再把 15 秒切成拍。120 BPM、60fps → 1 拍 = 30 帧，900 帧 = 30 拍：开场 4 · 六章各 3 · 五条规则 5 · 片尾 3。
- **产出：** `video/timeline.ts`（代码用）+ `process/timeline.json`（画图、画廊用，每章写清楚哪一帧发生什么）。
- **过关：** 每次换幕都落在拍点上；每章只有一个主角、一个动作。

### 07 · 视频代码：每一帧是一个函数

- **文件结构：**

  | 文件 | 内容 |
  |---|---|
  | `video/Memphis.tsx` | 总装：一张 SVG 舞台按时间轴挂载各章、运动模糊（每帧 5 次采样）、3.5% 胶片颗粒、配乐 |
  | `video/ui.tsx` | 本期的“工具箱”：积木 `Blk`、掉落 `Drop`（压扁回弹）、弹出 `Pop`、描边粗线 `Tube`、贴纸 `Tag`、波浪线 `squig`、六种纹样 `Patterns`、扫屏 `Sweep`、圆形转场 `Iris`、章节标题 `Caption` |
  | `video/opening.tsx` | 开场（积木 → MEMPHIS）+ 01 唱片 |
  | `video/chapters.tsx` | 02 书架 · 03 台灯 · 04 椅子 |
  | `video/finale.tsx` | 05 纹样 · 06 今天 · 五条规则 · 片尾 · 常驻底栏 |
  | `src/Root.tsx` | 注册 `S004-Memphis` |

- **一个动作是怎么写出来的（掉下来 → 压扁 → 回弹）：** 14 帧加速下落，落地那一刻纵向压扁 0.24、横向撑开，再用弹簧回到 1；以底边为原点缩放，所以压扁时积木“站”在地上：
  ```tsx
  // 示意：hb = 中心到底边的距离
  <Drop f={f} t0={14} x={640} y={520} hb={230}>
    <Blk d={circ(230)} fill={C.pink} />
  </Drop>
  ```
- **三条让动效“顶尖”的做法：**
  1. **每样东西都有重量。** 掉下来会压扁、会回弹，弹出来会过冲——孟菲斯的东西是“玩具”，动起来也要像玩具。
  2. **转场用颜色接力，不硬切。** 每次换幕是一块糖果色扫过来（边缘是波浪线），扫过来的颜色就是下一章的底色。
  3. **前 14 帧就要有“哇”。** 第 14 帧第一块积木砸下来，配一声调过音的“咚”。
- **过关：** `npm run studio` 里逐帧拖，任何一帧截下来都能当海报。

### 08 · 配乐与音效：和画面共用帧号

- **做什么：** `audio/make_music.py` 用 numpy 合成一整首 120 BPM、F 大调的意大利迪斯科。音效直接写帧号，和画面用同一套数字：
  ```python
  sfx(boing(200, 1.0), fr(441), 0.4, -0.3)   # f441 椅子上的第一颗球：弹簧“嘣”
  sfx(click(1.0), fr(346), 0.6, 0.15)        # f346 台灯“咔哒”亮起
  ```
- **响度：** 合成后用 ffmpeg loudnorm 测量、迭代到 **−14 LUFS**（流媒体平台的标准），真峰值 < −1 dBTP（本期约 −3.2）。
  ```bash
  npm run music:004   # → public/004-memphis/music.wav
  ```
- **过关：** 每一次落地、弹出都有声音；一整首，不是几段拼起来。**要有人戴耳机听一遍。**

### 09 · 质检循环：看 → 改 → 再看

不整片重渲，只看受影响的几帧：

```bash
npx remotion bundle src/index.ts --out-dir out/bundle                     # 打包一次
COMP=S004-Memphis PROPS='{"blur":1,"music":false}' \
  node scripts/stills.mjs out/bundle out/check 16 80 100 346 441           # 几秒钟出这几帧
python3 scripts/contact_sheet.py out/sheet.jpg --cols 5 \
  "out/check/f016.png|f016 压扁" "out/check/f080.png|f080 标签" ...        # 拼成一张图看
```

- 动作至少看起点、压扁最深的一帧、终点三帧，**错误大多出在中间帧**。
- 成片出来后：`contact_sheet.py --video` 精确抽帧做联系表，`timeline_chart.py` 叠上配乐波形检查剪辑点是否落在拍子上，`ffprobe` 核对规格。
- 改版记录写进 `PROCESS.md` §5：位置 · 问题 · 诊断 · 改了什么。

### 10 · 渲染与发布

```bash
npm run render:004    # 配乐 + 母版：out/004-memphis-master.mp4（crf16）
ffmpeg -i out/004-memphis-master.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -c:a aac -b:a 192k -movflags +faststart \
  out/004-memphis.mp4                                # 分享版（各平台都能播）
ffmpeg -i out/004-memphis.mp4 -vf "select=eq(n\,100)" -frames:v 1 -q:v 2 styles/004-memphis/video/cover.jpg   # 封面
```

1. 过程图：联系表、开场拆解、转场链、时间轴、流程图 → `process/`。
2. 提交：一期一个分支，视频不进 git。
3. 源码包：`git archive` 打出本期的源码（含共享脚本和工具清单）→ `004-memphis-source.zip`。
4. Release：tag `day-04`，上传 `004-memphis.mp4` 和源码包，正文附 SHA-256。
5. 画廊：向 `gallery/data/works.json` 添加条目（SHA-256 与 Release 一致），运行 `npm run gallery:readme`、`gallery:test`、`gallery:build`、`gallery:check`。

## 4 · 和 AI 一起做：开工提示词

这一期就是由 AI 智能体做的。想让 AI 帮你做下一期，可以从这段开始（把风格名换掉）：

```text
你在 design-style 仓库里做第 NNN 期：「风格名」。
1. 先读 styles/001—004 的 README.md、PROCESS.md、MAKING.md 和 docs/ 下的模板，列出每期必须有的产出。
2. 写一句话定义和「这一期观众能带走的一招」，之后所有画面都围着它。
3. 研究：时间线（只写能查证的，成立 / 首展 / 解散分开写）、3—5 条可执行规则、广度清单（≥6 个领域）、常见误区。
4. 先写 tokens（颜色+面积比、开源字体、线宽、BPM 换算成帧），再用 Python 生成 4 张 1080×1350 SVG。
5. 先写 timeline（每章 3 拍、换幕落在拍点），再写 Remotion 组件；转场用这个风格自己的元素接力，不硬切。
6. numpy 合成一整首配乐，音效写帧号，响度 −14 LUFS。
7. 每改一处只导出受影响的帧检查，转场必看中间帧；把改版记录写进 PROCESS.md。
8. 每完成一步就本地提交、打包备份。
9. 交付：分享版 MP4、封面、process/ 过程图、README / PROCESS / MAKING 三份文档、源码包、gallery 条目。
```

**和 AI 协作的经验：**
- **让 AI 看图，而不是只看代码。** 每一轮都导出截图让它自己检查；本期的投影被裁、底栏早跳一下，都是“看图”发现的。
- **给数字，不给形容词。** “描粗一点”不如“描边 5、投影 (10, 10)、不模糊”；“歪一点”不如“6° / 12° / 18° 三档，只歪玩具”。
- **人来听声音。** AI 能测响度、对齐拍点，但听不到“好不好听”——配乐一定要有人试听。
- **勤提交。** 沙盒、电脑都可能出意外；本期靠重放命令恢复了全部工作，但最省事的办法是每一步都 `git commit`。

## 5 · 投入与产出

| 项 | 数字 |
|---|---|
| 源码 | 视频约 1,100 行 TS · 配乐约 620 行 Python · 风格图约 690 行 Python |
| 外部素材 | 0（没有照片、没有音源、没有 AI 生图） |
| 单帧预览 | 每帧几百毫秒（半尺寸、关掉模糊） |
| 整片渲染 | 2 核机器几分钟（每帧 5 次运动模糊采样） |
| 成片 | 分享版约 43MB（颗粒 3.5%，大块平涂好压缩） |

## 6 · 文件地图

```
styles/004-memphis/
├─ README.md        # 风格指南：历史 · 规则 · 色板 · 字体 · 版式 · 误区 · 提示词 · 分镜
├─ PROCESS.md       # 制作过程：怎么想、哪里推翻重来
├─ MAKING.md        # 本文：用什么工具、按什么顺序、敲什么命令
├─ tokens.{ts,css,json}
├─ video/           # Remotion 源码 + cover.jpg
├─ audio/make_music.py
├─ images/          # make_svgs.py → *.svg → preview/（内嵌字体）→ png/（2x）
└─ process/         # 01 联系表 · 02 开场拆解 · 03 转场链 · 04 时间轴 · 05 本文流程图（.html 源文件可改）
```
