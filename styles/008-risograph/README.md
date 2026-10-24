# 008 · 孔版印刷 Risograph（1946—今天）

**中文** · [English](README.en.md)

> **一句话：** 三种油墨、一张会呼吸的纸——荧光粉印不进 CMYK，套不准不是事故，是这台机器的口音。

🛠 [制作过程](PROCESS.md) · 🖼 [图片源文件](images)

| 海报 | 速查卡 |
|:-:|:-:|
| <img src="images/preview/poster.svg" width="400" alt="海报" /> | <img src="images/preview/cheatsheet.svg" width="400" alt="速查卡" /> |
| **如果孔版印刷来做 app** | **三种油墨，七种颜色** |
| <img src="images/preview/app-ui.svg" width="400" alt="app 概念" /> | <img src="images/preview/inks.svg" width="400" alt="叠印" /> |

---

## 1 · 它从哪来

| 年份 | 事件 |
|---|---|
| **1946.9** | 羽山昇（Noboru Hayama）在东京世田谷用一台誊写机开了「理想社」。理想，日语读 Riso |
| **1954** | 日本第一支乳剂油墨 RISO INK 上市，理想科学从印刷店变成制造商 |
| **1958** | 理想科学推出誊写印刷机 RISO-GRAPH |
| **1967** | RISO FAX JF-7：热敏制版，不用再手刻蜡纸 |
| **1977.9** | 家用卡片印刷机 Print Gocco B6，年贺状的国民机器 |
| **1980.6** | 第一台 RISOGRAPH 办公孔版机：制版机 FX7200 + 印刷机 AP7200 |
| **1984.8** | **RISOGRAPH 007**：制版和印刷合成一台，当时被叫作「印刷机器人」 |
| **1986.8** | RISOGRAPH 007 DIGITAL，数字原稿可以直接制成版 |
| **1990s** | 学校讲义、教会周报、社团传单：便宜、快（最高约 150—200 张/分）、一种颜色一个滚筒 |
| **2000s—2010s** | 办公室把它换成复印机；艺术家和小出版社把它捡回来。小志、艺术书、海报——孔版印刷成了独立出版的口音 |
| **今天** | 美院、独立工作室、书展（Miss Read、NY Art Book Fair）几乎都能看到 Riso。油墨还是大豆油，纸还是未涂布的 |

**为什么重要：** 它不是“一种复古滤镜”，是一台真正的孔版印刷机：热敏头在薄膜版上烧掉微孔，滚筒把半透明的专色油墨从孔里挤到纸上。一种颜色过一遍机器。套不准、颗粒、叠印出来的第三色，都是这台机器自己的东西。

## 2 · 五条规则

| # | 规则 | 怎么做 | 小心 |
|:-:|---|---|---|
| 01 | **专色** Spot | 一种油墨一个滚筒。先选 2—4 支墨，再画。荧光粉、青绿、芥末黄是 CMYK 印不出来的颜色 | 不要拿 RGB 渐变去“模拟”Riso；先分色 |
| 02 | **叠印** Overprint | 半透明的墨叠在一起，颜色相乘（正片叠底）。粉×黄=朱红，青×黄=墨绿 | 不要用“盖住”的不透明色块；交叠处必须是第三色 |
| 03 | **套不准** Misregistration | 每过一遍纸都会偏 0.5—2 mm。把偏移画进去，当特征 | 不要在屏幕上对得死死的再抱怨印歪了 |
| 04 | **网点 / 颗粒** Halftone / Grain | 浅色用调幅网点或 Riso 的 Grain Touch（随机墨点），不要用透明度 | 大面积实地会糊、会粘滚筒；覆盖率超过约 80% 要小心 |
| 05 | **未涂布的纸** Uncoated | 大豆油墨没有干燥剂，靠吸进纸里。道林、米色、再生纸 | 铜版纸、过塑、厚涂层上它会永远是湿的 |

## 3 · 色板

本片三支专色 + 黑，数值是 Riso 官方油墨在屏幕上的近似（stencil.wiki / Pantone U）。印在纸上会随纸色和叠印改变。

| 名称 | HEX | Pantone U | 建议面积 | 用途 |
|---|---|---|:-:|---|
| 米白道林 | `#F3ECDB` | — | 55% | 底。未涂布，略暖 |
| 荧光粉 | `#FF48B0` | 806 U | 16% | 主角。CMYK 印不出来 |
| 青绿 | `#00838A` | 321 U | 14% | 第二色，压在粉上变藏蓝 |
| 芥末黄 | `#FFB511` | 116 U | 12% | 第三色，压在粉上变朱红、压在青上变墨绿 |
| 黑 | `#000000` | BLACK U | 3% | 工单、说明、套准靶 |

> 叠印色（纸 × 墨，逐通道相乘）：朱红 `#F4300F` · 墨绿 `#00570A` · 藏蓝 `#002352` · 三色近黑 `#001906`。

## 4 · 字体

| 用途 | 本项目 | 说明 |
|---|---|---|
| 标题 | **Archivo** 900（OFL，可变字重 / 字宽） | 有一点工业味的无衬线，压得够黑 |
| 工单 | **Space Mono** 400 / 700（OFL） | 版边、RUN 号、ppm、分色名 |
| 中文 | **思源黑体 / Noto Sans SC** 400—900（OFL） | 和专色一样干净，不取巧 |

## 5 · 版式参数

**视频（1920×1080）**
- 12 栏，模块 122，间距 24，边距 96；四角套准靶距边 48
- 标题 `RISOGRAPH` 248px，字宽按 Archivo 900 的真实字宽计算（约 1608px）
- 镜头焦点在字母 O 的内孔（字体文件里外框 45–788、内孔 271–562，单位 1/1000 em）
- 每 4 帧“重新印一张”：颗粒和偏移跳一下（boil）

**图片（1080×1350 竖图）**
- 6 栏 × 8 行，模块 135，间距 18，边距 90 / 72
- 所有色块 `mix-blend-mode: multiply`；颗粒用 SVG `feTurbulence`，不贴图

## 6 · 这样做 / 别这样

**✅ 这样做：** 先定 2—4 支专色 · 每色一张版 · 交叠处相乘 · 故意套不准 · 浅色用网点 · 印在未涂布的纸上
**❌ 别这样：** RGB 渐变当油墨 · 不透明色块盖住 · 屏幕上对得像矢量海报 · 铜版纸 + 过塑 · 超过四色还当它是胶印

## 7 · 其他误区

- **Riso ≠ 复印机。** 复印机是碳粉+热定影；Riso 是孔版+油墨。没有加热器，所以省电，也所以墨是湿的。
- **007 是型号，不是期号。** 1984 年的 RISOGRAPH 007 是第一台制版印刷一体机。本期是风格 008。
- **“数字”从 1986 年开始。** 1980 年的第一台还是模拟制版；007 DIGITAL 才接受数字原稿。
- **Grain Touch 不是 Photoshop 噪点。** 它是制版时热敏头烧掉的随机微孔，墨点有大有小。

## 8 · AI 提示词（直接复制）

**图片**

```
Risograph print poster, fluorescent pink teal mustard yellow soy inks on warm uncoated paper,
misregistered layers, visible halftone grain, overprint multiply blending, spot colors not CMYK,
registration marks, rubber stamps, bold industrial sans-serif title RISOGRAPH, lo-fi zine aesthetic,
not a clean vector poster --ar 4:5
```

**视频**

```
Motion graphics as a Risograph print run: three ink plates slam into register on the beat,
thermal head burns holes in a master, pink ink squeezes through, the same poster reprints
teal then yellow then black, plates fan apart and stack into overprints, sheets fly out as zines.
Grain, misregistration, multiply blending, 120 bpm, 120 pages per minute.
```

**代码**

```
孔版印刷风格：背景 #F3ECDB，专色 #FF48B0 / #00838A / #FFB511，叠印用 mix-blend-mode: multiply。
每种颜色一层，层与层之间故意偏移 2–6px 并微微旋转。浅色用网点或噪点遮罩，不要用透明度。
字体 Archivo 900 + Space Mono + Noto Sans SC。令牌见 tokens.css。
```

## 9 · 15 秒分镜

全片都是印出来的。换幕用这台机器自己的东西接力：孔 → 版 → 纸。剪辑点落在 120 BPM 的拍子上，每拍印一张（120 张/分）。

| 时间 | 帧 | 章节 | 画面 | 致敬 |
|---|---|---|---|---|
| 0:00—2.0 | 0—120 | 开场 | 三张版飞进来砸在一起；RISOGRAPH 逐字母升起；镜头钻进 O 的孔 | 主人选定的参考海报 |
| 2.0—4.0 | 120—240 | 01 孔版 | 热敏头扫过版纸烧掉微孔；粉墨挤出来；揭开版纸 | 1984 RISOGRAPH 007 制版 |
| 4.0—6.0 | 240—360 | 02 分色 | 同构图再过青绿、芥末黄、黑；四张版扇开 | 一色一滚筒 |
| 6.0—8.0 | 360—480 | 03 叠印 | 三圆相交，七种颜色逐个点名 | 半透明大豆油墨 |
| 8.0—10.0 | 480—600 | 04 小志 | 教材 → 社刊 → 小志 → 画册，一张张飞出来 | 2010s 独立出版复兴 |
| 10.0—12.5 | 600—750 | 05 五个词 | 专色 / 叠印 / 套不准 / 网点 / 颗粒，一拍一个 | — |
| 12.5—15.0 | 750—900 | 片尾 | 商店海报落回；「三种油墨，一张会呼吸的纸。」@guanmo_ai | — |

## 10 · 文件

```
008-risograph/
├─ PROCESS.md / PROCESS.en.md
├─ process/timeline.json
├─ tokens.ts / tokens.css / tokens.json
├─ video/Risograph.tsx          # 主合成、HUD、运动模糊、配乐
├─ video/opening.tsx            # 0—2 秒：对版、标题、钻进 O
├─ video/scenes.tsx             # 2—15 秒：孔版、分色、叠印、小志、五个词、片尾
├─ video/riso.tsx               # 纸、版、颗粒网、网点、套准
├─ video/ui.tsx · timeline.ts
├─ audio/make_music.py
└─ images/make_svgs.py          # poster / cheatsheet / app-ui / inks
```

**延伸阅读：** RISO 公司史（riso.co.jp/english/company/history）· stencil.wiki 油墨色表 · Printed Matter「Risograph Printed」· AIGA Eye on Design *Design With Limitations* · Everything Riso（SAIC Service Bureau）
