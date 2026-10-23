# 布局 01 · 便当盒布局 Bento Grid（2020s—）

**中文** · [English](README.en.md)

> **一句话：** 把一页内容装进大小不一的圆角格子里，一格只讲一件事，用面积告诉观众谁最重要。

> **风格塑造视觉，布局组织信息。** 这一期讲的不是一种“风格”，而是一种“布局”。风格决定颜色、字体和质感；布局决定东西放在哪、占多大。同一套格子，可以套上包豪斯、Metro、iOS 任何一种风格。

🎬 [看视频](https://github.com/guanmo-ai/design-style/releases/tag/layout-01) · 🛠 [制作过程](PROCESS.md) · 🖼 [图片源文件](images)

| 布局海报 | 布局速查 |
|:-:|:-:|
| <img src="images/preview/poster.svg" width="400" alt="布局海报" /> | <img src="images/preview/cheatsheet.svg" width="400" alt="布局速查" /> |
| **同一布局，六种风格** | **拿来就用：三套排法** |
| <img src="images/preview/skins.svg" width="400" alt="布局 × 风格" /> | <img src="images/preview/templates.svg" width="400" alt="布局模板" /> |

## 1 · 它从哪来

**名字：** 弁当（bentō）是日本的便当盒，一只盒子分成大小不一的格子，主菜占大格，小菜占小格，每格只装一样菜。把网页上的卡片想成格子、把每条信息想成一样菜，就是 Bento Grid。

| 年份 | 事件 |
|---|---|
| **1950—60 年代** | 瑞士国际主义：设计师把版面系统地划分成网格，所有元素对齐到同一套列线上。约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）1981 年把这套方法写成《平面设计中的网格系统》。这是便当盒**真正的祖先** |
| **2010** | 微软发布 Windows Phone 7 和 Metro 设计语言：开始屏幕由大小不同的“动态磁贴”拼成，直角、窄缝、纯色，磁贴还会翻面 |
| **2012** | Windows 8 把磁贴开始屏幕搬到电脑桌面 |
| **2020** | iOS 14 加入桌面小组件：小、中、大三种尺寸，和图标一起拼进同一张网格 |
| **2020 年代初** | 苹果在发布会和官网上用一页圆角格子罗列产品卖点：大格放主角，小格放数据 |
| **2022—2023** | “Bento Grid”这个叫法在设计圈流行起来：bento.me 一页式个人主页、Dribbble 上的卖点展示页、Linear / Vercel 等产品官网 |
| **今天** | 成为产品官网、个人主页、数据看板最常见的排法之一 |

**它为什么不算一种风格：** 便当盒只规定“格子怎么分、怎么对齐”，不规定颜色、字体和质感。所以本项目把它放进单独的“布局”系列，编号和风格系列分开：**布局 01**。上表里的 Metro 磁贴和 iOS 小组件，是后来被追认的“前身”，当时没有人叫它 Bento。

## 2 · 五条规则

| # | 规则 | 怎么做 | 小心 |
|:-:|---|---|---|
| 01 | **一格一事** | 每张卡只讲一个信息：一个数字、一张图，或者一句话 | 一格里塞一段长文，就变成了表格 |
| 02 | **大小分级** | 面积就是优先级。一屏只放一张 2×2 主角，其余用 1×1、2×1、1×2 | 格子全一样大，就没有主角 |
| 03 | **统一间距** | 所有缝一样宽，16—24px，全站只用一个值 | 间距忽大忽小，网格就散了 |
| 04 | **统一圆角** | 24—32px，全站只用一个值；卡片里再套卡片时，内圆角 = 外圆角 − 内边距 | 内外圆角一样大，嵌套的卡片看起来会“鼓” |
| 05 | **对齐网格** | 所有卡片的边都落在同一套列线上：桌面 4 列 → 平板 3 列 → 手机 2 列 | 别为了塞内容破格 |

## 3 · 色板

便当盒是布局，**没有“正宗配色”**。下面是视频里用的苹果发布会式配色；换成包豪斯或 Metro 的颜色，格子照样成立（见「同一布局，六种风格」）。

| 名称 | HEX | 用途 |
|---|---|---|
| 底 | `#000000` | 深色画布 |
| 卡片 | `#161618` → `#0F0F11` | 卡片自上而下的轻微渐变，外加 1px `rgba(255,255,255,.07)` 描边 |
| 文字 | `#F5F5F7` | 大数字、标题 |
| 次要 | `#86868B` | 标签、说明 |
| 浅底 / 浅卡 / 浅字 | `#F2F2F4` / `#FFFFFF` / `#1D1D1F` | 浅色版本（个人主页） |
| 强调 | `#FF8A1F` → `#FF2D6F` → `#A63DFF` | 只给主角卡和最重要的数字 |

## 4 · 字体

| 用途 | 本项目 | 商用原版 / 其他选择 |
|---|---|---|
| 大数字 / 标题 | **Inter Display** 600，字距 -0.045em（免费，OFL） | SF Pro Display · Söhne |
| 正文 | **Inter** 400 / 500 + **思源黑体 / Noto Sans SC**（免费，OFL） | 苹方 · HarmonyOS Sans |
| 编号 / 标注 | **Geist Mono** 500（免费，OFL） | SF Mono · JetBrains Mono |
| Metro 那一段 | **Selawik**（微软开源，OFL） | Segoe UI / Segoe WP |

## 5 · 版式参数

- **视频 1920×1080：** 4 列，左右边距 96、上下边距 100，间距 20，内边距 40；圆角 32（发布会）、28（个人主页）、24（产品后台）
- **竖图 1080×1350：** 外边距 72，4 列、每列 219，间距 20，圆角 32
- 尺寸只用 **1×1 / 2×1 / 1×2 / 2×2** 四种；一屏放 5—9 张卡最好读
- 大数字 96—172px，标签 22—26px：字号反差越大，越像发布会
- 嵌套：外圆角 32 − 内边距 12 = 内圆角 20

## 6 · 这样做 / 别这样

**✅ 这样做：** 一屏一个主角 · 数字放大到夸张 · 卡片内边距留足 · 全站同一套间距和圆角 · 纯黑底配深灰卡，或浅灰底配白卡
**❌ 别这样：** 格子全一样大 · 每格都上渐变 · 阴影和描边叠着用 · 间距忽大忽小 · 为了塞内容破格

## 7 · 其他误区

- **便当盒不是苹果发明的。** 网格来自瑞士设计，磁贴来自 Windows Phone；苹果把它用到了最出名。
- **便当盒不是瀑布流。** 瀑布流（Masonry）只对齐列，卡片高度跟着内容走；便当盒的行和列都对齐，每张卡多大是事先设计好的。
- **到了手机上要重排，不能等比缩小。** 4 列改成 2 列，按从左到右、从上到下的顺序排成一列，主角始终最宽。

## 8 · AI 提示词（直接复制）

**图片（Midjourney / 即梦 / ChatGPT 图像）**

```
Bento grid layout: a 4-column grid of rounded cards with equal 20px gaps and 32px corner radius,
one hero card spanning 2x2, the others 1x1, 2x1 and 1x2, each card shows exactly one thing
(a huge number, an icon, or a short headline). Apple keynote look: pure black background,
dark gray cards #161618, white text, one orange-pink-purple gradient only on the hero card,
Inter Display typography, generous padding, clean, no clutter --ar 4:5
```

**风格 + 布局（把任意一期风格套进便当盒）**

```
[Bauhaus / Swiss International / Frutiger Aero …] style, laid out as a bento grid:
4 columns, equal gaps, one 2x2 hero card, one idea per card, all edges aligned to the columns.
Use the colors, typography and textures of the style; keep the grid structure of the bento layout.
```

**视频（Runway / 可灵 / Sora）**

```
Motion graphics: a bento grid of rounded cards on a black background reflows into a new
arrangement on every beat. Cards slide and resize along a 4-column grid with fast-in, slow-out
easing, the hero card grows to 2x2, numbers count up inside the cards. Clean Apple keynote look,
150 bpm, no 3D, no camera shake.
```

**代码（让 AI 写网页 / 组件）**

```
用便当盒布局（Bento Grid）做这个页面：CSS Grid 4 列，gap 20px，所有卡片 border-radius 32px、padding 40px；
只用 1×1 / 2×1 / 1×2 / 2×2 四种尺寸，一屏只有一张 2×2 主角，每张卡只放一个信息；
宽度 ≤1024px 改成 3 列，≤640px 改成 2 列。颜色和字体沿用【你的风格】。设计令牌见 tokens.css。
```

## 9 · 15 秒分镜

全片只有 **7 张卡片**，从头到尾不换，调整布局与视觉风格。它们在 9 种排法之间重排：讲出它从哪来、有哪些规则、能用在哪。所有重排都落在 150 BPM 的拍子上：卡片移动最快的那一刻，正好是鼓点。

| 时间 | 帧 | 章节 | 画面 | 致敬 |
|---|---|---|---|---|
| 0:00—0.8 | 0—48 | 开场 | 一张主角卡淡入：Bento Grid 便当盒布局 | — |
| 0.8—2.6 | 48—156 | 01 发布会 | 主角卡“裂开”成发布会式的 7 格：续航 22 小时、图形性能 2×、4 种配色、主动降噪开关、起售价 ¥5,999 | 苹果发布会的卖点总结页 |
| 2.6—4.2 | 156—252 | 02 名字的由来 | 同样的格子缩进一只红漆便当盒，每格一样菜：米饭梅干、玉子烧、三文鱼、西兰花、炸鸡、小番茄…… | 日本弁当 |
| 4.2—5.8 | 252—348 | 03 前身 · 2010 | 盖子收起，格子变成 Metro 动态磁贴。和 02、04 同一种版式：左边是年份、名字、一句话和一条 2010 → 2012 的小时间线；右边一整面磁贴墙斜着退进黑暗里，像一扇门慢慢打开。整面墙只用一个主题色（钴蓝）：照片（第 001 期海报的双色调）、日历翻面、邮件、天气、音乐、消息 | Windows Phone 7 · 2010 / Windows 8 · 2012 |
| 5.8—7.4 | 348—444 | 04 前身 · 2020 | 磁贴飞进手机，变成小、中、大三种尺寸的桌面小组件 | iOS 14 · 2020 |
| 7.4—9.8 | 444—588 | 05 五条规则 | 卡片变成线框，打上间距、圆角标注，五条规则逐条出现；鼓声停下，音乐变闷，每条规则响一声“叮” | — |
| 9.8—11.4 | 588—684 | 06 个人主页 | 浅色、bento.me 式，一张卡片只放一样东西，每张卡片同一套排版（左上灰色小标题 + 一个大主角 + 最多一行说明）：头像栏、GitHub（贡献格子沿品牌渐变着色）、X、已发布 2 期、最新作品（包豪斯海报整张铺满）、每期短片 15 秒、每天一个设计风格、正在播放（就是本片的配乐） | bento.me |
| 11.4—13.0 | 684—780 | 07 产品后台 | 深色、Linear 式数据看板：收入曲线、活跃用户、转化率、流量来源 | Linear · Vercel |
| 13.0—15.0 | 780—900 | 片尾 | 7 张卡片缩回一个小图标 →「风格塑造视觉，布局组织信息。」 | — |

<a href="https://github.com/guanmo-ai/design-style/releases/tag/layout-01"><img src="video/cover.jpg" width="800" alt="短片里的发布会式便当盒（点击看视频）" /></a>

> 画面里的手机、磁贴、个人主页和后台都是重绘的示意，不是截图；产品数据均为虚构。
> Metro 磁贴按本期的参数重画（圆角 24、缝 24），原版是直角、窄缝；配色沿用 Windows Phone 的做法：整面墙只用一个主题色。

## 10 · 文件

```
01-bento-grid/
├─ PROCESS.md                             # 制作过程
├─ process/                               # 过程图：v1 联系表 · v2 分镜 · 转场拆解 · 节拍时间轴
├─ tokens.ts / tokens.css / tokens.json   # 同一份设计令牌（tokens.css 附一个可直接用的 .bento 网格）
├─ video/BentoGrid.tsx                    # 短片主合成：7 张卡片在 9 种排法之间重排（Remotion，React）
├─ video/layout.ts                        # 每种排法的 7 个矩形、转场时间表、缓动
├─ video/content.tsx                      # 发布会 / 规则 / 个人主页 / 产品后台的卡片内容
├─ video/history.tsx                      # 起源三章：便当盒 / Metro 磁贴 / iOS 小组件
├─ video/overlays.tsx                     # 卡片之外的元素：规则栏、标注、章节栏、片尾
├─ video/ui.tsx                           # 排版工具与小部件
├─ video/cover.jpg                        # 视频封面
├─ audio/make_music.py                    # 配乐：numpy 合成，F 大调 150 BPM，-14 LUFS
└─ images/
   ├─ make_svgs.py    # 生成下面四张图：python3 make_svgs.py
   ├─ poster.svg      # 布局海报（海报本身也按便当盒排）
   ├─ cheatsheet.svg  # 布局速查
   ├─ skins.svg       # 同一布局，六种风格
   ├─ templates.svg   # 三套排法：产品卖点 / 个人主页 / 数据看板
   └─ preview/        # 内嵌字体的自包含 SVG
```

**延伸阅读：** Josef Müller-Brockmann《Grid Systems in Graphic Design》· Microsoft《Metro Design Language》· Apple Human Interface Guidelines · Widgets
