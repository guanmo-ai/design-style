# 010 · Paper Cut 剪纸层叠（民间传统 — 今天）

**中文** · [English](README.en.md)

> **一句话：** 剪纸不止一种。六种可命名的纸感，用撕、揭、折、剪交棒——换一种剪纸，就换一种运动。

🎬 视频待发布 · 🛠 [制作过程](PROCESS.md) · 🧰 [从 0 到 1：工具与流程](MAKING.md) · 🖼 [图片源文件](images)

| 海报 | 速查卡 |
|:-:|:-:|
| <img src="images/preview/poster.svg" width="400" alt="海报" /> | <img src="images/preview/cheatsheet.svg" width="400" alt="速查卡" /> |
| **如果剪纸层叠来做 App** | **四步改造** |
| <img src="images/preview/app-ui.svg" width="400" alt="天气 App 概念：风景收进手机，滑动视差" /> | <img src="images/preview/steps.svg" width="400" alt="四步改造：平涂 → 剪影 → 叠阴影 → 视差" /> |

---

## 1 · 它从哪来

| 年份 | 事件 |
|---|---|
| **约 105 年** | 蔡伦改进造纸。纸一出现，剪、刻、叠就有了材料 |
| **唐—宋** | 窗花、喜花成为节庆民俗。传统剪纸通常是**单层**、多红色、讲究“连得住” |
| **20 世纪中** | 纸雕塑、纸拼贴进入插画与动画：一层层纸被 recut、被打光，阴影第一次被当成造型 |
| **2010 年代** | Eiko Ojala 等人把“数码剪纸”做成杂志封面语言：一层一色、边缘硬、影子软。Hari & Deepti 用纸盒透光做立体西洋景 |
| **2014—2020** | 天气 App、旅行 App、品牌启动页大量使用层叠山丘：它方便做**视差滚动**，也便宜（全是矢量） |
| **今天** | 编辑海报、App 空状态、品牌片头仍在用这一套。CSS / Lottie / Remotion 都能让层以不同速度移动——**层移即故事** |

**为什么重要：** 剪纸层叠把“深度”从透视和光影里抽出来，变成可以数的层。设计师不需要会画体积，只要会**切片**：远的一张、中的一张、近的一张，影子落在下一张上。移动这几张纸，观众自己会补出空间。

> 这一期讲的是**现代层叠插画**（papercutout / paper diorama），不是民俗窗花的纹样课。两者亲戚，但规则不同：窗花要连、要吉祥；层叠要分开、要阴影、要会动。

## 2 · 五条规则

| # | 规则 | 怎么做 | 小心 |
|:-:|---|---|---|
| 01 | **一层一色** ONE COLOR | 每一张纸只涂一种颜色。深浅靠再叠一层，不靠渐变 | 在同一层上画渐变或体积光，它就变成印刷插画 |
| 02 | **阴影即深度** SHADOW | 层与层之间留一道软影（往下 6—20px，略模糊）。没有这道影，剪纸就是贴纸 | 别用硬投影去冒充孟菲斯；也别糊成一团雾 |
| 03 | **剪影不描细节** SILHOUETTE | 形状是剪刀剪出来的外轮廓。内部细节用挖洞，或再叠一张更小的纸 | 别在一层上描树皮、窗户、渐变天空 |
| 04 | **远慢近快** PARALLAX | 远层视差 0.1—0.3，近层 0.8—1.2。镜头一横移，深度自己长出来 | 所有层同速平移 = 一张贴图在滑，没有层 |
| 05 | **限色家族，一点红日** FAMILY | 3—6 阶同类色（这里是青绿家族）+ **一个**暖色强调（红日） | 每层换一个无关色，纸堆会吵 |

## 3 · 色板

| 名称 | HEX | RGB | 建议面积 | 用途 |
|---|---|---|:-:|---|
| 夜空 | `#071820` | 7 24 32 | 22% | 最远的一张纸 |
| 红日 | `#E23A2B` | 226 58 43 | 4% | 全片唯一的暖色 |
| 远山 L6 | `#134A5C` | 19 74 92 | 10% | 最远的山 |
| 岭 L5 | `#1B6572` | 27 101 114 | 10% | 远山 |
| 中远 L4 | `#287E7C` | 40 126 124 | 12% | 中远山 |
| 中景 L3 | `#3D9884` | 61 152 132 | 12% | 中景 |
| 近山 L2 | `#6BB894` | 107 184 148 | 12% | 近山 |
| 浅山 L1 | `#B8DCC8` | 184 220 200 | 10% | 前景浅层 |
| 纸 | `#F6F3EB` | 246 243 235 | 6% | 笔记本卡片、编辑器 |
| 墨 | `#142028` | 20 32 40 | 2% | 正文 |

> 红日是光源，也是强调色。拿掉它，这套青绿就只是“青绿色块”；留下它，纸堆才有时间（黄昏）和主角。

## 4 · 字体

| 用途 | 本项目 | 商用原版 / 其他选择 |
|---|---|---|
| 拉丁标题 | **Jost** 500—800（免费，OFL；几何无衬线，Futura 的开源替代） | Futura · Avenir · Century Gothic |
| 中文 | **思源黑体 / Noto Sans SC** 500 / 700 / 900 | 阿里巴巴普惠体 · 霞鹜新晰黑 |
| 层号 / 标注 | **JetBrains Mono** 500 | IBM Plex Mono · Space Mono |

**说明：** `PAPERCUTOUT` 用 Jost，字距略放（+8%）；中文标题用思源黑体 700/900；`L6 FAR` 这类层号用等宽，整数对齐。Jost 没有中文，中英混排时中文交给思源黑体。

## 5 · 版式参数

**视频（1920×1080，60fps，120 BPM）**
- 节拍：**1 拍 = 30 帧**；六种变体 6+7+6+6+7+7 拍，盖章 9 拍，一共 **24 秒 / 1440 帧**
- 交棒只用纸的招式：展开 / 撕开 / 揭层 / 刀切 / 毛边 / 折页，重叠 **32 帧**
- 几何层的视差：`0.16 / 0.28 / 0.42 / 0.60 / 0.82 / 1.08`；闲时每层慢漂
- 层间阴影：远 6/8px、中 12/12px、近 20/16px；立体纸板幕阴影跟侧光走
- 胶片颗粒 4%

**图片（1080×1350 竖图）**
- 左右边距 **90**、上下边距 **72**
- 风景、树、太阳全部是路径；阴影用 `feDropShadow`
- 字宽按 Jost / 思源黑体真实度量计算

## 6 · 这样做 / 别这样

**✅ 这样做：** 一层一色 · 影子落在下一张纸上 · 只剪外轮廓 · 远层几乎不动、近层跟手走 · 同类色 + 一个红日
**❌ 别这样：** 没阴影的贴纸 · 所有层同速平移 · 一层上画树皮和渐变天空 · 把民俗窗花的“连得住”套到层叠风景上 · 每层换一个无关色

## 7 · 其他误区

- **剪纸层叠 ≠ 传统窗花。** 窗花是单层镂空、要连成一张；层叠是多张纸、要分开、要有影子。
- **不等于 2.5D 拟物。** 不要在纸面上加高光、环境光、AO。纸是平的，深度只活在层与层之间。
- **层数太少看不出。** 两层像前后两张卡；五到八层才有“纸堆”。
- **视差不是滤镜。** 它是叙事：先让远层几乎不动，再让近层走过镜头，观众才会相信空间。

## 8 · AI 提示词（直接复制）

**图片（Midjourney / 即梦 / ChatGPT 图像）**

```
layered paper-cut landscape illustration, papercutout diorama, six flat-color hill silhouettes
in a teal-mint family from dark navy #071820 to pale mint #B8DCC8, one red sun #E23A2B with
triangular rays, pine tree silhouettes, soft drop shadow between each paper sheet, no gradients
on a single layer, no textures except paper grain, editorial poster, 4:5 --ar 4:5
```

**视频（Runway / 可灵 / Sora）**

```
Motion graphics in layered paper-cut style: hills stack from back to front with spring pops,
a red sun scales in, camera pans and near layers move faster than far layers, the same landscape
becomes a poster on an editor artboard, then a weather app illustration with scroll parallax,
then a brand title sequence flying through the paper strata. Soft paper shadows, no 3D lighting,
120 bpm, continuous motion, no static holds.
```

**代码（让 AI 写网页 / 组件）**

```
用剪纸层叠做这个英雄区：背景 #071820，6 层山用绝对定位的 SVG path，颜色分别是
#134A5C #1B6572 #287E7C #3D9884 #6BB894 #B8DCC8，每层 box-shadow / feDropShadow 往下
6–20px。滚轮或鼠标 X 让第 n 层 translateX(pan * [0.16,0.28,0.42,0.6,0.82,1.08][n])。
红日 #E23A2B 只出现一次。字体 Jost + Noto Sans SC。不要渐变填单层，不要 3D 光照。
设计令牌见 tokens.css。
```

## 9 · 24 秒分镜（剪纸博览）

不是一座山加五条文字规则。全片是一场**剪纸风格博览**：每 2–3 秒一种可命名的变体，交棒用纸自己的动作。片尾不是字幕卡：开场那朵窗花转回来、收成一点、砸成印章。逐格纸层怎么动见 [`process/timeline.json`](process/timeline.json)。每个元素几帧出场见 [`process/stagger.json`](process/stagger.json)。

| 时间 | 帧 | 变体 | 纸层怎么动 |
|---|---|---|---|
| 0:00—3.0 | 0—180 | 民俗红纸镂空 | 中缝弹出，左右页旋转展开；窗花镂空一圈圈被剪开；整朵慢旋 |
| 3.0—6.5 | 180—390 | 几何色块层叠 | 红纸撕开；六层山按色阶错位滑入再叠齐；远慢近快横移 |
| 6.5—9.5 | 390—570 | 立体景深纸板 | 侧光扫过、阴影变长；近层揭起；落进编辑海报 |
| 9.5—12.5 | 570—750 | 单色剪影 | 刀锋对切：左白底黑剪 / 右黑底白剪；两半拉开再拍合 |
| 12.5—16.0 | 750—960 | 水彩纸毛边 | 毛边撕开，露出天气 App；同一座山在手机里 parallax |
| 16.0—19.5 | 960—1170 | 字体剪纸 | PAPER 从纸堆剪穿；汉字「剪」落下 |
| 19.5—24.0 | 1170—1440 | 盖章 | 开场同一朵窗花旋转收成一点，砸成红纸印章；三句改成门笺挖空；**@guanmo_ai** 横批挖穿 |

## 10 · 文件

```
010-paper-cut/
├─ PROCESS.md                             # 制作过程
├─ MAKING.md                              # 从 0 到 1
├─ process/timeline.json                  # 分镜
├─ process/stagger.json                   # 逐个出场：变体 × 元素 × 帧
├─ tokens.ts / tokens.css / tokens.json
├─ video/PaperCut.tsx                     # 主合成：交叠揭纸转场
├─ video/timeline.ts
├─ video/layers.tsx                       # 同一座风景、视差、揭层
├─ video/opening.tsx · chapters.tsx · finale.tsx · ui.tsx
├─ audio/make_music.py                    # numpy，120 BPM，G 大调，-14 LUFS
└─ images/make_svgs.py                    # 四张图
```

**延伸阅读：** 王伯敏《中国民间剪纸史》· Eiko Ojala 杂志封面访谈 · Hari & Deepti paper dioramas · 消费美学研究所里的 paper cut / papercraft 条目
