# 011 · 粘土拟态 Claymorphism（2021—）

**中文** · [English](README.en.md)

> **一句话：** 胖圆角、成对阴影，像刚捏出来的——控件不是画的，是掐出来的体积。

🛠 [制作过程](PROCESS.md) · 🧰 [从 0 到 1](MAKING.md) · 🖼 [图片源文件](images)

| 海报 | 速查卡 |
|:-:|:-:|
| <img src="images/preview/poster.svg" width="400" alt="海报" /> | <img src="images/preview/cheatsheet.svg" width="400" alt="速查卡" /> |
| **如果粘土拟态来做 app** | **四步捏出一颗按钮** |
| <img src="images/preview/app-ui.svg" width="400" alt="app 概念" /> | <img src="images/preview/recipe.svg" width="400" alt="捏法" /> |

---

## 1 · 它从哪来

| 年份 | 事件 |
|---|---|
| **2019–2020** | 新拟态（Neumorphism）把控件做成和底同色的浮雕。好看一天，对比度不够，也没有“材料” |
| **2021** | Dribbble / 产品概念稿里开始出现更胖、更彩、更鼓的界面：有人叫 Soft UI，有人叫 Claymorphism |
| **2021.2** | Michal Malewicz 等把“粘土拟态”写成可执行的界面做法：大圆角、内外双阴影、pastel、微鼓 |
| **2022–2023** | 儿童产品、健康、专注、金融的“温和”界面大量借用。好的版本像 Stripe 插画落到控件上；坏的版本是一盘糖果 |
| **今天** | 它不是皮肤滤镜。它规定**体积怎么被光打到**——圆角多胖、阴影是否成对、按下时体积怎么瘪 |

**为什么重要：** 扁平化之后，界面重新需要手感。新拟态用同色凹凸，粘土拟态用**彩色的软体积**。普通人一看就想按；设计师拿走的是一条光、一对阴影、一个半径，而不是一张情绪板。

**这一期最有用的一招：** *先捏体积，再画界面。* 所有画面围着这一招转。

## 2 · 五条规则

| # | 规则 | 怎么做 | 小心 |
|:-:|---|---|---|
| 01 | **胖圆角** Fat radius | 按钮半径趋近半高；卡片 ≥ 48。先写大，再看要不要收 | 不要用 8–16 的“系统默认圆角”冒充粘土 |
| 02 | **成对阴影** Twin shadows | 外：软投影在光的对面。内：朝光 inset 高光，背光 inset 暗 | 不要只丢一层 `box-shadow: 0 8px 24px` |
| 03 | **粉笔 pastel** Chalky pastel | 蜜桃 / 薄荷 / 薰衣草 / 雾蓝。饱和度压住，像干过的粘土 | 不要荧光、不要纯红黄蓝 |
| 04 | **微鼓** Soft bulge | 径向渐变：高光偏光源，暗部收边。体积是填出来的 | 不要细描边、不要玻璃高光 |
| 05 | **挤捏反馈** Squish | 按下：Y 向压扁 8–12%，外影收、内凹加深 | 不要只改透明度和灰色叠加 |

## 3 · 色板

| 名称 | HEX | 建议面积 | 用途 |
|---|---|:-:|---|
| 冷灰蓝工作台 | `#E7EDF4` | 52% | 底。比纸白冷，比新拟态底暖 |
| 蜜桃粘土 | `#F3B89A` | 18% | 主角。全片接力的那一颗 |
| 薄荷粘土 | `#A8D4B8` | 8% | 开关、对的圆角 |
| 薰衣草粘土 | `#C4B4E0` | 8% | 第二手、休息态 |
| 玫瑰粘土 | `#E8A8B6` | 6% | 点缀 |
| 雾蓝粘土 | `#A8C4E0` | 5% | 手机壳 |
| 奶油粘土 | `#F0EBE3` | 3% | 信息幕底栏、光球 |

光默认**左上**。外影偏右下，内高光偏左上。换光源时两对一起转。

## 4 · 字体

| 用途 | 本项目 | 说明 |
|---|---|---|
| 标题 | **Fredoka** 600–700（OFL，圆头可变） | 字母本身像一块软糖，但不走孟菲斯的描边 |
| 中文 | **思源黑体 / Noto Sans SC** 500–900（OFL） | 字重拉开层级，字距略松 |
| 标注 | **JetBrains Mono**（OFL） | 半径读数、底栏、工单 |

## 5 · 版式参数

**视频（1920×1080）**
- 12 栏，模块 122，间距 24，边距 96（与 002 同一套栏，给粘土留呼吸）
- 卡片半径 56，手机壳 72，按钮半径 = 半高
- 成对阴影从令牌算：外 12/20/36 + 内 ±8/10/16
- 24.0 秒 · 60 fps · 120 BPM · 1 拍 = 30 帧

**图片（1080×1350 竖图）**
- 6 栏 × 8 行，模块 135，间距 18，边距 90 / 72
- 体积用径向渐变 + `feDropShadow`，不贴图

## 6 · 这样做 / 别这样

**✅ 这样做：** 先定左上光 · 圆角先写 48 · 内外阴影成对 · pastel 粉笔 · 按下挤扁
**❌ 别这样：** 新拟态同色浮雕 · 单层扁平投影 · 细描边当体积 · 饱和糖果盘 · 按下只闪灰

## 7 · 其他误区

- **粘土拟态 ≠ 新拟态。** 新拟态和底同色、靠极浅凹凸；粘土拟态是彩色软体积，对比度可以够。
- **它不是 2021 的滤镜。** 坏的粘土是一盘没光的糖果。好的粘土是一条光能算出来的材料。
- **不要和果冻 / 玻璃搞混。** 果冻透明、玻璃反环境；粘土不透明、吃光。
- **本期不碰 010 剪纸。** 010 主人已搁置；本目录是全新的 011。

## 8 · AI 提示词（直接复制）

**图片**

```
Claymorphism UI, fat rounded peach clay button, dual shadows (soft outer drop +
inset highlight), chalky pastel mint lavender rose, soft 3D bulge, cool gray-blue
desk #E7EDF4, no outlines, no glass, no neon, as if just pinched --ar 4:5
```

**视频**

```
Motion graphics: a lump of peach clay falls and is pinched into a fat pill button
on the first beat, corners inflate, a light orb orbits so inner highlight and
outer shadow travel as a pair, pastel lumps knead in, the same button drops into
a focus-timer phone (toggle, slider, stacked cards), ends on a clay title card.
Soft squish springs, 120 bpm, 24 seconds.
```

**代码**

```
粘土拟态：背景 #E7EDF4，主角 #F3B89A。圆角 ≥ 48。box-shadow 必须四层：
外软投影两层 + inset 高光 + inset 暗部。填充用朝左上的径向渐变。
按下 scaleY 0.9，内影加深。字体 Fredoka + Noto Sans SC。令牌见 tokens.css。
```

## 9 · 24 秒分镜

全片都是捏出来的。换幕用**同一颗蜜桃粘土**接力。剪辑点落在 120 BPM 的拍子上。

| 时间 | 帧 | 章节 | 画面 |
|---|---|---|---|
| 0:00—4.0 | 0—240 | 开场 | 面团落下；第一拍掐成按钮；CLAY 四块字母弹出；粘土拟态 |
| 4.0—8.0 | 240—480 | 01 圆角 | 按钮胀成卡片；四角 8→56；尖卡被捏走 |
| 8.0—12.0 | 480—720 | 02 阴影 | 光球绕卡片；内外影成对；扁平卡被体积吞掉 |
| 12.0—16.0 | 720—960 | 03 软色 | 四团 pastel 揉进来；三下挤捏 |
| 16.0—20.0 | 960—1200 | 04 产品 | 同一颗按钮落进 PINCH：开关 / 滑杆 / 层叠 |
| 20.0—24.0 | 1200—1440 | 片尾 | Claymorphism / 粘土拟态 /「先捏体积，再画界面。」/ 底栏三件套 |

## 10 · 文件

```
011-claymorphism/
├─ PROCESS.md / PROCESS.en.md / MAKING.md
├─ process/timeline.json
├─ tokens.ts / tokens.css / tokens.json
├─ video/Claymorphism.tsx     # 主合成、镜头、运动模糊、配乐
├─ video/clay.tsx             # 成对阴影、英雄接力、纸面
├─ video/opening.tsx          # 0–4 秒：掐住、字母
├─ video/scenes.tsx           # 圆角、阴影、软色、产品、片尾
├─ video/ui.tsx · timeline.ts
├─ audio/make_music.py
└─ images/make_svgs.py        # poster / cheatsheet / app-ui / recipe
```
