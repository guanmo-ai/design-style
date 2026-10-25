# 011 · 粘土拟态 · 从 0 到 1：这支视频是怎么做出来的

🎬 审片中 · 📐 [风格指南](README.md) · 🛠 [制作过程](PROCESS.md)

## 0 · 先说结论

全部用代码做：Remotion 4 画面、numpy 配乐、手写 SVG 风格图。没有 AI 生图、没有外部采样。
顺序：令牌 → 粘土原语 → 时间轴 → 开场“哇” → 规则表演 → 产品 → 片尾信息幕 → 一整首 BGM → 静帧质检 → 母版。

## 1 · 工具箱

| 环节 | 工具 | 用来做什么 |
|---|---|---|
| 画面 | Remotion 4.0 · React 19 | 1920×1080@60，`CameraMotionBlur` |
| 配乐 | Python · numpy · ffmpeg loudnorm | 从零合成，−14 LUFS |
| 风格图 | 手写 SVG · fontTools · Chromium | 1080×1350，内嵌字体子集 |
| 字体 | Fredoka · Noto Sans SC · JetBrains Mono | 全部 OFL |

## 2 · 准备环境

```bash
npm ci
# 本期最少字体：
# public/fonts/Fredoka.ttf  JetBrainsMono.ttf  NotoSansSC-{Regular,Medium,Bold,Black}.otf
npm run music:011
npx remotion studio src/index.ts    # 选 S011-Claymorphism
```

## 3 · 十步

1. 写下“最有用的一招”：先捏体积，再画界面。
2. 令牌：`tokens.ts / .css / .json` 同一份色、半径、阴影。
3. `clay.tsx`：四层阴影函数 + `heroOf` 接力。过关：静帧能看出体积。
4. `process/timeline.json`：6×4 秒，拍点对齐。
5. 开场单独做：f30 必须有“哇”。
6. 规则用动作：胀圆角、转光、揉色、挤捏。少写字。
7. 产品做成 PINCH，不要示意图。
8. 片尾对齐 008 `End`，信息幕也是粘土。
9. `make_music.py` 软开头，响度打到 −14 LUFS。
10. `make_svgs.py` + 关键帧静帧；最后才整片渲。

## 4 · 过关标准

- 第一拍（0.5s）有掐住的满足感
- 全程在动，没有假结尾、没有中段死停
- 片尾能读完带走句，底栏三件套齐
- 风格图 / 封面都是代码渲染
- 不出现 010 目录

## 5 · 文件地图

见 [风格指南 §10](README.md#10--文件)。合成 id：`S011-Claymorphism`。
