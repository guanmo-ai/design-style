# 布局 03 · 卡片层叠 · 制作过程

**中文** · [English](PROCESS.en.md)

> 这一期是怎么从“卡片层叠”四个字变成 22 秒短片和 4 张图的：怎么想的、怎么做的、哪里被否决、怎么整片重来。
> 过程图在 [`process/`](process)，可复现的代码在 `video/` `audio/` `images/`。

📐 [布局指南](README.md)

---

## 0 · 一览

| # | 步骤 | 产出 | 工具 / 文件 |
|:-:|---|---|---|
| 1 | 选题与定调 | 一句话 + 和布局 01 / 02 的差别 | — |
| 2 | 研究 | 时间线、五条规则、何时用、常见坑 | [`README.md`](README.md) §1—§7 |
| 3 | 设计令牌 | 冷灰 + 产品蓝、Inter、14px 抬起、−1.2° | `tokens.ts / .css / .json` |
| 4 | 视频 v1 | 18s，同一叠换皮、两次弧线换页 | `video/`（已推翻） |
| 5 | 否决 | 「画面枯燥、学不到东西、没有 A/B-roll、密度差太远」 | — |
| 6 | 视频 v2 | 22s，同一叠走九种世界，对标 Bento | `video/layout.ts` `cards.tsx` `chrome.tsx` |
| 7 | 配乐 | F 大调 120 BPM，numpy，−14 LUFS，22s | `audio/make_music.py` |
| 8 | 布局图 ×4 | 海报 · 速查 · 四种排法 · 三套模板 | `images/make_svgs.py` |
| 9 | 质检 | 关键帧、联系表、时间轴、成片 | `scripts/stills.mjs` |
| 10 | 发布 | 母版 MP4、封面、仓库（draft PR） | remotion · ffmpeg |

---

## 1 · 选题与定调

**为什么做它：** 布局 01 用面积排主次，布局 02 用最短列往下淌。卡片层叠是第三种：用**前后**说“现在只处理这一张”。它也是普通人每天会碰到的：iOS 底部弹层、支付详情、待办队列。

**定调：**

- 一句话：*3–4 张圆角卡片叠在一起，同一时刻只有最上面那张在被读。*
- 气质：iOS sheet / Stripe dashboard，干净高级，信息密度要对齐 Bento。
- 受众：设计师拿去就能用（张数、抬起、旋转、压暗、CSS）；普通人看完能复述「Card Stack 怎么用、何时用」。

## 2 · 研究

1. **名字：** card stack = 一叠卡片。中文“层叠”说的是前后，不是左右。
2. **时间线：** 扑克/名片 → 2012 Tinder → 2013 iOS 7 的层 → Wallet → 2020s 的 sheet / 抽屉 / 队列。
3. **规则：** 3–4 张 / 一张焦点 / 轻抬 / 微旋 / 后层压暗。
4. **对标：** `layouts/01-bento-grid`——同一套卡，每一幕是不同世界；卡内有真实内容；有历史/产品 B-roll；HUD / 标注 / 交棒运镜。

## 3 · 设计令牌

- **颜色：** 纸 `#F4F5F7`，卡片 `#FFFFFF`，墨 `#0F172A` / `#64748B`，蓝 `#2563EB`；世界里另有 Stripe 紫、毡绿、夜海军。
- **字体：** Inter Display + Inter + Noto Sans SC + Geist Mono。全部 OFL。
- **层叠：** 680×380，圆角 28，抬起 14，旋转 −1.2°，每层向左上露出 24 / 38px，暗 11%。
- **节拍：** 120 BPM，1 拍 = 30 帧，全片 22 秒 = 1320 帧。
- **缓动：** 世界切换用 Bento 同款 `REFLOW = bezier(0.6, 0, 0.12, 1)` + stagger。

## 4 · 视频 v1（已否决）

v1 用同一叠 4 张仪表盘卡走完全片：弹进、抬起、两次弧线换页、换一张皮（iOS grabber / Stripe 顶条）、线框规则、误区。画布几乎一直是冷灰，卡内是同一套数字块。

主人否决要点：

- BGM 还行，画面枯燥，看不下去
- 学不到东西：只是「一个东西在那随便变变变」
- 没有 A-roll / B-roll
- 对比仓库前面那些片子，元素密度差太远

这和 Bento 的 v1→v2 是同一类病：内容太薄，只有一种世界。

## 5 · 视频 v2（对标 Bento）

从 Bento 学到的、必须对齐的：

| Bento 做法 | Card Stack v2 |
|---|---|
| 同一套 7 卡贯穿，每幕不同世界 | 同一套 4 卡贯穿，每幕不同世界 |
| 卡内真实内容（图标、数字、图表、文案） | Wallet 登机牌、Stripe 支付、Linear 详情、地图选点、扑克/名片/档案 |
| 历史/产品 B-roll（漆盒、磁贴、手机、主页、后台） | 手机机身、Stripe 浏览器、毡面、深度轴 |
| HUD / 章节条 / 测量标注 | 底部 07 章 HUD、五条中英规则、Figma 式测量 |
| REFLOW + stagger 交棒 | 同一套缓动，世界之间变形而不是硬切 |

八章（约 22s）：钩子 → iOS A-roll → 后台 B-roll → 隐喻 B-roll → 爆炸拆解 → 规则面板 → 坏→好 → 片尾。

![动效分解](process/02-motion.jpg)

## 6 · 分镜与节拍

先写 [`process/timeline.json`](process/timeline.json)，再写代码。逐帧表见 [布局指南 §9](README.md#9--22-秒分镜)。

![分镜联系表](process/01-storyboard.jpg)

![时间轴](process/04-timeline.png)

## 7 · 声音

`audio/make_music.py` 用 numpy 从零合成，**没有外部采样**：

- **编排：** F 大调，和弦换在世界切点上。
- **对位：** 四张卡进场玻璃叮；每个世界切点 whoosh + 音色变化；规则段鼓停、低通变薄；误区一层层闷响；片尾收束。
- **响度：** ffmpeg `loudnorm` → −14 LUFS，时长 22.0 秒。

## 8 · 布局图

四张 1080×1350，由 `images/make_svgs.py` 生成，再经 `scripts/build_images.py` 子集化字体。参考图与封面都是代码渲染，没有 AI 生图。

## 9 · 质检与渲染

```bash
npm run music:L03
npm run render:L03          # → out/03-card-stack-master.mp4
npm run images:L03
```

封面：iOS Wallet 幕里登机牌在顶层的一帧 → `video/cover.jpg`。成片不进 git。

## 10 · 下期沿用

- [ ] 先判断是风格还是布局；布局要写出和上一期的差别
- [ ] 全片同一批元素变形，但**每一幕必须是不同世界**
- [ ] 卡内要有真实内容；要有 A-roll 和 B-roll，不能只换皮
- [ ] 最快的一刻落在拍点上；声音和画面共用帧号
- [ ] numpy 配乐，不引入外部采样
