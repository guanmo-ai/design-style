# 010 · Paper Cut 剪纸层叠 · 从 0 到 1：这支视频是怎么做出来的

> [`PROCESS.md`](PROCESS.md) 讲怎么想，这份讲怎么做：工具、顺序、命令、过关标准。

🎬 视频待发布 · 📐 [风格指南](README.md) · 🛠 [制作过程](PROCESS.md)

## 0 · 先说结论

- **全部是代码。** 山、树、太阳、阴影、视差、配乐都由仓库里的源码生成，没有 AI 生图，没有外部音源。
- **谁做的。** 本轮由云端智能体从零交付；人选定气质海报，并要求预览优先、draft PR、成片不进 git。
- **为什么用代码。** 视差系数和阴影档必须是数字；同一座山要在视频和四张图里长得一样。
- **顺序。** 令牌 → 层叠世界 → 时间轴 → 场景外壳 → 声音 → 风格图 → 预览渲染。

## 1 · 工具箱

| 环节 | 工具 | 用来做什么 | 费用 |
|---|---|---|---|
| 视频 | Remotion 4.0.538 + React | `frame → 画面`；SVG 画层 | 个人与小团队免费 |
| 配乐 | numpy + ffmpeg loudnorm | 合成与 −14 LUFS | 免费 |
| 风格图 | Python SVG + fontTools + Playwright | 路径图、内嵌字体、2x PNG | 免费 |
| 字体 | Jost · Noto Sans SC · JetBrains Mono | OFL | 免费 |

## 2 · 准备环境

```bash
git clone https://github.com/guanmo-ai/design-style.git && cd design-style
npm ci
npm run fonts
pip install numpy fonttools pillow matplotlib
npx playwright install chromium
npm run studio   # 选 S010-PaperCut
```

## 3 · 十步，从 0 到 1

### 01 · 抄结构，不抄画面

过关：新目录和 005 / 006 / 008 并排看，像一个系列。

### 02 · 写出最有用的一招

过关：每个画面都能回答“它在演示层移”。答不上来的删掉。

### 03 · 研究清单变成章节

三个真实场景（编辑海报 / App / 片头）+ 规则 + 坑 + 片尾。

### 04 · 令牌

过关：`tokens.ts` / `.css` / `.json` 颜色一致；视差表和阴影档写死。

### 05 · 先做不动的山，再让它动

关键：`World` 里每层 `translateX(cam.x * PARA[i])`，组上只做缩放和 Y，避免视差加倍。

```ts
const px = cam.x * PARA[i + 1] * lock + partX(f, i) + idleX;
```

过关：横移时远山几乎不动，近山明显走。

### 06 · 场景只换外壳

编辑器、手机、遮幅、规则卡片都是壳；山不换。过关：转场时山还在。

### 07 · 交叠揭纸

下一幕提前 20 帧用波形纸边盖上来，落在拍点。过关：没有静帧硬切。

### 08 · 配乐

```bash
python3 styles/010-paper-cut/audio/make_music.py
# loudness -14.xx LUFS
```

过关：ffmpeg loudnorm 印出约 −14 LUFS；揭层听得到纸响。

### 09 · 四张图

```bash
python3 styles/010-paper-cut/images/make_svgs.py
python3 scripts/build_images.py styles/010-paper-cut/images
```

过关：海报能对上选定气质；没有位图照片、没有 AI 图。

### 10 · 预览，不入库成片

```bash
npm run render:010   # → out/010-paper-cut-master.mp4
```

过关：1920×1080、60fps、约 20s；mp4 只在 `out/` 与审阅附件，不进 git。

## 4 · 和 AI 一起做

开工提示词（可复用）：按本仓库 002 / 便当盒的丝滑标准，做 `styles/010-paper-cut/`，20 秒，层移即故事，numpy −14 LUFS，图代码渲染，draft PR，成片不进 git。

## 5 · 投入与产出

源码在 `styles/010-paper-cut/`；外部素材无；预览渲染视机器，大约数十分钟级。

## 6 · 文件地图

见 [风格指南 §10](README.md#10--文件)。
