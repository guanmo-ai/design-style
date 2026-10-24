# 008 · 孔版印刷 · 制作过程

**中文** · [English](PROCESS.en.md)

> 这一期是怎么从主人选定的参考海报变成 15 秒短片和 4 张图的。
> 过程图在 [`process/`](process)，可复现的代码在 `video/` `audio/` `images/`。

📐 [风格指南](README.md)

---

## 0 · 一览

| # | 步骤 | 产出 | 工具 / 文件 |
|:-:|---|---|---|
| 1 | 选题与定调 | 一句话 + “这一期最有用的一招” | 主人选定的 Risograph 参考海报 |
| 2 | 研究 | 时间线、五条规则、油墨近似值、误区 | [`README.md`](README.md) §1—§7 |
| 3 | 设计令牌 | 三支专色 + 黑、叠印色、两张网格、节拍 | `tokens.ts / .css / .json` |
| 4 | 印刷机 | 纸、版、颗粒网、网点、套准 | `video/riso.tsx` |
| 5 | 风格图 ×4 | 海报 · 速查卡 · 工单 app · 三种油墨七种颜色 | `images/make_svgs.py` |
| 6 | 视频 | 开场对版 → 孔 → 分色 → 叠印 → 小志 → 五个词 → 片尾 | `video/*.tsx` |
| 7 | 配乐 | 120 BPM，一整首，−14 LUFS | `audio/make_music.py` |
| 8 | 质检 | 关键帧、联系表、节拍时间轴 | `stills.mjs` · `contact_sheet.py` · `timeline_chart.py` |

## 1 · 选题与定调

**为什么是孔版印刷：** 前几期里，波普用过网点、瑞士用过“套印反白”，但都还是干净的色块。Riso 是真的油墨：半透明、会错位、会漏白。主人选定的参考海报已经把气质定死——荧光粉 / 青绿 / 芥末黄、套准靶、圆印、大标题错位——短片按这个气质做成一次完整的印刷。

**这一期最有用的一招：** *一种颜色一张版，版和版之间正片叠底。* 所有画面都围着这一招转。

**定调：**

- 一句话：*三种油墨，一张会呼吸的纸。*
- 质感：未涂布的米白纸 + 三支专色。不是干净矢量海报。
- 叙事：一次印刷——对版、制版、过机、叠印、出纸、五个词、落回商店海报。
- 接力：孔（O 的内孔）→ 版纸 → 印张。不硬切。
- 边界：不碰 `styles/007-minimalism/`。

## 2 · 研究

核对过的事实（写进画面和指南之前）：

- 1946.9 羽山昇在世田谷开理想社；1954 RISO INK；1980.6 第一台 RISOGRAPH（FX7200 / AP7200）；1984.8 RISOGRAPH 007 一体机；1986.8 007 DIGITAL。来源：RISO 公司史。
- 制版：热敏头在 master 上烧微孔，滚筒挤墨，未涂布纸，约 150—200 张/分。来源：RISO 产品页、Wikipedia Risograph。
- 油墨 HEX：Fluorescent Pink `#FF48B0`、Teal `#00838A`、Sunflower `#FFB511`。来源：stencil.wiki（Pantone U 近似）。
- 2010s 独立出版复兴：Chicago Spare Press / Tan & Loose、AIGA Eye on Design、Printed Matter。

## 3 · 印刷机先于画面

`video/riso.tsx` 在浏览器里用确定性随机数生成纸纹和墨的遮罩（实地漏白、深浅不匀、走纸条纹、Grain Touch 颗粒网），做成 CSS class。每张 `Plate` 一种油墨、`mix-blend-mode: multiply`、每 4 帧跳一次偏移。网点用调幅公式 `r = pitch · √(tone / π)`。

过关标准：单独截一张版，能看出“这是印上去的，不是填色”。

## 4 · 风格图

| 图 | 目的 |
|---|---|
| 海报 | 对标参考图：RISOGRAPH 三色错位、几何、圆印、版边 |
| 速查卡 | 四支墨 + 叠印三圆 + 五条规则 |
| 工单 app | 滚筒、张数、开始制版——不像激光打印机 |
| 三种油墨 | 七种叠印色 + 四步做法 |

管线：`make_svgs.py` → `scripts/build_images.py`（内嵌 Archivo / Space Mono / 思源黑体子集）。

## 5 · 分镜与节拍

时间轴见 [`process/timeline.json`](process/timeline.json)。7 段，剪辑点全部落在拍点上。逐帧表见 [风格指南 §9](README.md#9--15-秒分镜)。

## 6 · 声音

`audio/make_music.py` 用 numpy 从零合成：

- 120 BPM，F 小调 → A♭ 收束。鼓从第 2 秒不断，只在 12.25 秒停一口气。
- 音效全是“机器”的：对版重击、热敏头扫描、烧孔嘀嗒、油墨咕噜、揭版、进纸、出纸。
- 时间点直接写帧号。响度 −14 LUFS，真峰值 < −1 dBTP。
- 没有外部采样库。

## 7 · 渲染

```bash
npm run music:008
npx remotion studio src/index.ts          # 选 S008-Risograph
npm run render:008                        # 母版 out/008-risograph-master.mp4
npm run images:008
```

成片不进 git。关键静帧和分享版 MP4 放在本轮 artifacts，供主人审片。

## 8 · 踩坑

| 问题 | 处理 |
|---|---|
| 第一帧颗粒还没解码，色块是“干净矢量” | `preloadTextures()` + `delayRender`，等遮罩图加载完再截 |
| 可变字体 Archivo 的字宽要对上镜头焦点 | 关掉 kerning，用 hmtx 算 O 的内孔中心 |
| 007 极简主义另有代理在审片 | 本分支不碰 `styles/007-minimalism/`，Root 只加 S008 |
| 叠印色不能目测 | `mixInks()` 按纸 × 墨 × 密度逐通道相乘，文档和画面共用 |
| 五个词段落 HUD 半透明残留「04 小志」 | 对标瑞士：开场钻孔与五个词整段让开，不再用 0.85 残留 |

## 9 · 沿用清单

- [x] 先写“最有用的一招”，所有画面围着它转
- [x] 换幕用这个风格自己的元素接力
- [x] 配乐是一整首
- [x] 尺寸从令牌和字体度量算出来
- [x] 与 007 完全隔离
