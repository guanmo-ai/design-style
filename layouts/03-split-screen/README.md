# 布局 03 · 分屏布局 Split Screen（1927—）

**中文** · [English](README.en.md)

> **一句话：** 一条中线，两种声音；左边说话，右边给证据。

> **风格塑造视觉，布局组织信息。** 分屏不规定颜色和质感，只规定“页面被一条线切成两个舞台，每个舞台一个角色”：切成什么比例、谁固定谁滚动、窄了怎么叠。同一条中线，可以是登录页（50:50）、产品首屏（62:38），也可以是后台和文档（70:30）。

🎬 [看视频](https://github.com/guanmo-ai/design-style/releases/tag/layout-03) · 🛠 [制作过程](PROCESS.md) · 🧰 [从 0 到 1](MAKING.md) · 🖼 [图片源文件](images)

| 布局海报 | 布局速查 |
|:-:|:-:|
| <img src="images/preview/poster.svg" width="400" alt="布局海报" /> | <img src="images/preview/cheatsheet.svg" width="400" alt="布局速查" /> |
| **分屏 ≠ 两栏** | **拿来就用：三套分屏** |
| <img src="images/preview/compare.svg" width="400" alt="分屏 vs 两栏 vs 侧栏 vs 便当盒" /> | <img src="images/preview/templates.svg" width="400" alt="三套分屏模板（桌面 + 手机）" /> |

## 1 · 它从哪来

**名字：** 英文 *Split Screen* 是“把一块屏幕分成几块”。电影里叫分屏，电脑里叫分屏 / 并排，网页里叫分屏布局（split-screen layout）。三者做的是同一件事：**一块画面里同时放两个角色，中间只有一条线。**

| 年份 | 事件 |
|---|---|
| **1927** | 阿贝尔·冈斯（Abel Gance）的电影《拿破仑》结尾用三台放映机把三块银幕并排，叫 Polyvision（三联银幕）：把分屏做成奇观的早期例子 |
| **1959** | 《枕边细语》（Pillow Talk）把一通电话拍成左右两半：两个人各在一个画面里，同一场戏。分屏从此成了喜剧和对话戏的常用语法 |
| **2009** | Windows 7 的 Aero Snap：窗口拖到屏幕边缘，自动占满一半。“分屏”变成每个人每天的操作 |
| **2010** | 伊桑·马科特（Ethan Marcotte）在 A List Apart 提出[响应式网页设计](https://alistapart.com/article/responsive-web-design/)：同一页内容随宽度换排法。分屏“窄了叠成上下”的规则从这里来 |
| **2015** | iPad 的 Split View（iOS 9）与 OS X El Capitan 的 Split View：两个 App 各占一块，中缝可以拖，比例由人定 |
| **2017** | [CSS Grid](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout) 进入各主流浏览器：一行 `grid-template-columns: 1.618fr 1fr` 就写出了 62:38 |
| **2022** | `svh` / `lvh` / `dvh` 视口单位进入主流浏览器：`100svh` 解决手机地址栏造成的高度偏差 |

**它为什么是布局：** 分屏只规定“几块、什么比例、谁固定谁滚、窄了怎么叠”，换什么颜色、字体都成立。所以和便当盒、瀑布流一样放进“布局”系列：**布局 03**。

## 2 · 五条规则

| # | 规则 | 怎么做 | 小心 |
|:-:|---|---|---|
| 01 | **只有一条中线** | 两半满幅、没有缝；分界就是两块颜色的边，不加阴影和描边 | 给每一半加圆角和阴影，两半就变成两张卡片，不再是分屏 |
| 02 | **比例要有意思** | 50:50 对等（登录、对比）· 62:38 主次（首屏、品牌）· 70:30 内容 + 侧栏（后台、文档） | 49:51 这种“差不多”最糟：看不出谁主谁次 |
| 03 | **两边要有反差** | 明暗 / 图文 / 静动，一次只选一对；每一半的文字与底色对比度 ≥ 4.5 : 1 | 三对一起用，两边都在喊，反差就没了 |
| 04 | **一边固定，一边滚** | 固定的一半 `position: sticky; top: 0; height: 100svh; align-self: start`；滚的一半放长内容 | Grid 子项默认拉伸到整行高，不写 `align-self: start`，sticky 就“不动”；祖先有 `overflow: hidden` 也会失效 |
| 05 | **手机上叠成上下** | 窄过 768px 改成单列；谁重要谁写在 HTML 前面；一屏只讲一件事 | 手机上继续左右各 50%：每半只剩 190px，字会折成一列 |

## 3 · 色板

分屏是布局，**没有“正宗配色”**。规则只有一条：**两半之间要有一对强反差，其余让位。** 视频与布局图用的是三色：

| 名称 | HEX | 用途 | 对比度 |
|---|---|---|---|
| 墨 | `#0E0E10` | 暗的一半、正文 | 墨 / 纸 **16.5 : 1** |
| 纸 | `#F1EDE4` | 亮的一半、暗面上的文字 | 纸 / 蓝 **5.9 : 1** |
| 蓝 | `#2B35FF` | 第二种声音：另一半的底色、按钮 | 墨 / 蓝只有 2.8 : 1，**不要把墨色字放在蓝底上做正文** |
| 浅钴蓝 | `#8E95FF` | 墨色上的编号、小标签 | 浅钴蓝 / 墨 **7.2 : 1** |
| 灰（纸上） | `#6B675E` | 纸上的次要文字 | **4.8 : 1** |
| 灰（墨上） | `#8A877F` | 墨上的次要文字 | **5.4 : 1** |

> 大字（巨型标题）不受 4.5 : 1 限制，所以海报里的“Split”可以把墨色字放在蓝底上；小字不行。

## 4 · 字体

| 用途 | 本项目 | 商用原版 / 其他选择 |
|---|---|---|
| 巨字 / 标题（Split、1927） | **Archivo** 900，字宽 wdth 62—125（免费，OFL） | Druk Wide · GT America Expanded |
| 中文标题 / 正文 | **思源黑体 / Noto Sans SC** 400—900（免费，OFL） | 苹方 · HarmonyOS Sans |
| 代码 / 标注 / 读数 | **Space Mono** 400 / 700（免费，OFL） | SF Mono · JetBrains Mono |

分屏的版面很“满”，字要粗、要大、要直：两个舞台各自要撑得住，不需要衬线的细腻。

## 5 · 版式参数

| 场景 | 比例 | `grid-template-columns` | 在 1920 宽里 |
|---|---|---|---|
| 登录 / 注册 / 对比 | 50 : 50 | `1fr 1fr` | 960 / 960 |
| 产品首屏 / 品牌页 | 62 : 38 | `1.618fr 1fr` | 1187 / 733 |
| 后台 / 文档 | 70 : 30 | `7fr 3fr`（侧栏需要下限时用 `minmax(0, 1fr) minmax(280px, 30%)`） | 1344 / 576 |
| 反过来：左固定窄、右滚宽 | 38 : 62 | `1fr 1.618fr` | 733 / 1187 |

- **高度：** `min-height: 100svh`，不要写死 `height`；内容长就让页面长。固定的那一半才用 `height: 100svh`。
- **断点：** 768px 以下叠成上下。视频里窗口从 1440 缩到 390，窄过 768 的一刻中线转了 90°。
- **每半的行长：** 正文每行 45—75 个拉丁字符，中文约 25—35 个字；中线挪动后文字会重新折行，这是预期的，别用固定换行去“修”它。
- **中线两侧的留白：** 文字离中线至少 56px（视频里是 72px），不要让字贴着色块的边。

## 6 · 这样做 / 别这样

**✅ 这样做：** 中线贴着内容的重心 · 一半满、一半空（留白也是一个声音）· 固定的一半放“标题和目录”，滚的一半放“证据和细节”· 窄屏上文字在上 · 给每一半写清楚标题（`<section aria-labelledby>`）· 反差只选一对

**❌ 别这样：** 把两半做成带圆角带阴影的卡片 · 两半都塞满 · 在中线上放按钮或关键数字 · 手机上不叠 · 固定的那一半比一屏还高（内容会被截断，滚不到）

## 7 · 其他误区

- **分屏不是两栏。** 两栏网页有边距、有栏间距、有最大宽度，是一篇文章的两列；分屏是满幅、没有缝，每一半是一个整块（见布局图《分屏 ≠ 两栏》）。
- **分屏不是侧栏。** 侧栏是固定像素宽度 + 弹性内容，导航是工具；分屏的比例用百分比 / `fr`，两边都是主角。
- **`100vh` 在手机上会偏高。** 手机浏览器的地址栏会遮住一截，`100vh` 按“地址栏收起时”的高度算，内容会被挤到屏幕外。用 `100svh`（小视口高度），旧浏览器用 `100vh` 做回退（见下面的代码）。
- **横屏的手机很矮。** 宽 > 768px、高 < 500px 时仍是左右分屏，但 `100svh` 只有几百像素，固定的那一半会装不下。给这种情况取消 sticky：`@media (max-height: 500px) { .split__pinned { position: static; height: auto; } }`。
- **视觉顺序 ≠ 阅读顺序。** 屏幕阅读器和 Tab 键按 HTML 顺序走。用 `order` 把后面的一半挪到前面，视觉和阅读就脱节了（[WCAG 1.3.2、2.4.3](https://www.w3.org/TR/WCAG22/)）。要让谁先被读到，就把谁写在 HTML 前面。
- **不能只靠颜色分两半。** 色盲用户看不出“蓝 vs 墨”（[WCAG 1.4.1](https://www.w3.org/TR/WCAG22/)）。每一半都要有自己的标题或标签。
- **窄屏不能出现横向滚动。** 放大到 400% 或视口窄到 320px，页面应该仍能纵向阅读（[WCAG 1.4.10 Reflow](https://www.w3.org/TR/WCAG22/)）。叠成上下正好满足它。

可直接用的代码见 [`tokens.css`](tokens.css)：

```css
.split {
  display: grid;
  grid-template-columns: 1.618fr 1fr;      /* 62 : 38 */
  min-height: 100vh;
  min-height: 100svh;                      /* 不支持 svh 的浏览器用上一行 */
}
.split > * { min-width: 0; }               /* 长内容不要撑爆某一半 */
.split__pinned {                           /* 固定的一半 */
  position: sticky; top: 0;
  height: 100svh;
  align-self: start;                       /* 不写这一行，sticky 在 Grid 里不会动 */
}
@media (max-width: 767px) {                /* 手机：叠成上下 */
  .split { grid-template-columns: 1fr; min-height: 0; }
  .split__pinned { position: static; height: auto; }
}
```

## 8 · AI 提示词（直接复制）

**图片（Midjourney / 即梦 / ChatGPT 图像）**

```
Split-screen layout poster: the canvas is cut by one vertical line at 61.8% into two full-bleed
halves with no gap — left half ink black #0E0E10, right half cobalt blue #2B35FF; a gigantic
heavy grotesque word "Split" crosses the line and flips color at the cut (paper white on black,
black on blue); flat color, no shadows, no outlines, no gradients; small monospace labels,
a ratio readout "61.8 %" on the line; Swiss poster, calm, confident --ar 4:5
```

**风格 + 布局（把任意一期风格套进分屏）**

```
[Bauhaus / Swiss International / Neo-Brutalism …] style, laid out as a split-screen layout:
the page is divided by a single straight line into two full-bleed halves with no gap, ratio 62:38
(or 50:50 / 70:30), each half is one piece with its own background color and one role
(left = statement, right = evidence). Strong contrast between the two halves, only one pair of
contrasts (light/dark OR image/text OR still/motion). Use the colors, typography and textures of
the style; keep the split structure.
```

**视频（Runway / 可灵 / Sora）**

```
Motion graphics: a screen split by one vertical line into two halves; on every beat the left
half scrolls up while the right half scrolls down in opposite directions, swapping pages; a
giant word is assembled like a zipper from the two halves; the dividing line slides from 50:50 to
62:38 to 70:30 while text reflows; a browser window shrinks from desktop to phone and the dividing
line rotates 90 degrees so left/right becomes top/bottom. Ink black, paper white, cobalt blue,
flat, hard edges, 120 bpm, no 3D, no shadows.
```

**代码（让 AI 写网页 / 组件）**

```
用分屏布局做这个落地页：外层 .split 用 display: grid，grid-template-columns: 1.618fr 1fr；
min-height: 100vh 并用 100svh 覆盖；两半满幅、没有缝，左边墨黑右边钴蓝，不要圆角、阴影和描边。
左边是固定的一半（position: sticky; top: 0; height: 100svh; align-self: start），右边放长内容。
< 768px 时改成单列并取消 sticky，文字在上、图在下（HTML 里文字写在前面）。
每一半的文字与底色对比度不低于 4.5:1。设计令牌见 tokens.css。
```

## 9 · 20 秒分镜

全片只有一个主角：**中线**。画面永远被它切成两半，每一半各自说话；章节靠“反向传送带”翻页——左半向上、右半向下同时滑走，落定帧正好在拍点上。120 BPM，1 拍 = 30 帧。

| 时间 | 章节 | 画面 |
|---|---|---|
| 0.0—2.5s | 01 定义 | 中线画下来，钴蓝从线上铺开；“Split”被拉链拉合（左半字母从下往上、右半的 t 从上往下），咬合一下；一条中线，两种声音 |
| 2.5—5.5s | 来历 | 左边年份数字滚轮向上滚，右边示意图向下滚：1927 三联银幕 → 1959 电话分屏 → 2009 Aero Snap → 2015 Split View |
| 5.5—9.0s | 02 比例 | 同一张落地页，中线 50:50 → 62:38 → 70:30：文字重新折行、海报长出新东西，两边宽度实时标注，底部的 CSS 跟着变 |
| 9.0—11.5s | 03 反差 | 明 / 暗 → 图 / 文 → 静 / 动：每一对都从中线向两边撕开；一次只选一对 |
| 11.5—14.5s | 04 滚动 | 左边固定、右边滚（序号和滚动条跟着变）；再反过来：左边向下、右边向上 |
| 14.5—17.5s | 05 响应式 | 浏览器从 1440 缩到 390；窄过 768 的一刻两栏叠成上下，整条中线转 90° |
| 17.5—20.0s | 片尾 | 海报被横着切开，中线转回竖直；五个词一个接一个：一条中线 · 比例 · 反差 · 固定与滚动 · 上下叠 |

> 画面里的网页、窗口、手机和 App 都是重绘的示意，不是截图；Windows / iPad 的界面是示意图；页面文案均为虚构。照片为 AI 生成，沿用布局 02。
