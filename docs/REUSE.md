# 可复用动效与配乐

从已完成的 003 → 004 → 001 / 布局 02 / 005，以及 015 提炼。风格画面、分镜、时间轴、配色和字体继续由各期负责。共用库不导入任何一期的 tokens；原片的 `ui.tsx` / `kit.tsx` 是注入原 tokens 的适配层，可以直接照着调用。

## 起步与验证

```sh
node scripts/new_style.mjs 020-example
npm run music:020
npm run preview:020
```

先检查当前分支和远端是否已有该期号。脚本拒绝同号目录、命令、合成以及重复运行；保留已有注册与命令。生成 `video/` 主合成、时间轴、场景表、外框、曲线，`audio/` 编排骨架，`images/` SVG 骨架和中英文指南 / 过程文档；自动注册 60fps 正片与 30fps 草稿，添加 `music / render / render:gpu / preview / images` 五条命令。它只创建本地骨架，成片发布仍遵守审片步骤。

Node 依赖沿用现有锁文件。配乐、字体度量、曲线与像素核验使用项目已有的 Python 工具依赖，可在独立环境安装：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
source .venv/bin/activate
npm run test:media
```

`npm test` 包含画廊、安全与动效 / 起步脚本的 Node 测试；Python 检查单独用 `test:media`，不要求只部署画廊的 CI 安装渲染工具链。

## 003：轴向几何、镜头、排字与提示

入口：`src/lib/motion/axis.tsx` 的 `createAxisKit({C, FONT, BEAT, U, N})`；主题接口 `AxisTheme`。`C` 只需要 `ink / paper / red`，`FONT` 只需要 `sc / cond`。轴向量和每拍帧数由调用方提供。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `on` | 003 | 主轴 / 副轴定位：`on(origin, 160, 40)` |
| `pt / add / mix / dir / pts` | 003 | 点、方向、插值与 SVG 坐标串：`pts(wedge(tip, -30, 300, 80))` |
| `wedge` | 003 | 按尖端、方向、长度与半宽生成楔形：`wedge(tip, -30, 300, 80)` |
| `bar` | 003 | 旋转矩形：`bar(center, -30, 500, 80)` |
| `hull` | 003 | 投影顶点的凸包：`hull(points)` |
| `arcPath` | 003 | 圆弧路径：`arcPath(center, 120, 0, 90)` |
| `Poly` | 003 | SVG 多边形：`<Poly p={points} fill={ink} />` |
| `stamp / Scale` | 003 | 拍点盖章，绕指定点缩放：`const {s,o}=stamp(f,at)` → `<Scale x={x} y={y} s={s} o={o}>…</Scale>` |
| `halftone` | 003 | 灰度函数转 45° 网点路径：`halftone(x, y, w, h, 12, tone)` |
| `slashPoly` | 003 | 副轴斜切转场：`slashPoly(progress, reverse)` |
| `cam / zoomIn` | 003 | 镜头变换与对数推进：`cam(cx, cy, zoomIn(p, 12))` |
| `Txt` | 003 | 使用调用方中西文字体：`<Txt x={x} y={y} size={80} sc>标题</Txt>` |
| `Credit / Tip` | 003 | 左右署名 / 教学提示：`<Tip f={f} at={at} a="规则" b="说明" panel />` |

```tsx
const kit = createAxisKit({C, FONT, BEAT: 25, U, N});
const hit = kit.stamp(f, 50), tip = kit.on({x: 960, y: 540}, 200);
<kit.Scale x={tip.x} y={tip.y} s={hit.s} o={hit.o}>
  <kit.Poly p={kit.wedge(tip, -30, 400, 100)} fill={C.red} />
</kit.Scale>
```

## 004：落地、长出与颜色接力

入口：`src/lib/motion/blocks.tsx` 的 `createBlockKit({C, F, LINE, SHADOW, SQUASH, beat})`。`BlockTheme` 列出所需色槽和字体名；`beat` 默认 30，其他值由各期 tokens 传入。固定图案种子沿用原作。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `circ / rect / tri / half` | 004 | 中心圆、圆角矩形、三角与半圆路径：`rect(240, 100, 20)` |
| `poly / squig / squigV` | 004 | 多边形、横竖波浪线：`squig(x, y, 600, 40, 5)` |
| `Blk / Tube` | 004 | 描边、投影与逐段长出的线：`<Tube d={path} c={color} w={30} p={progress} />` |
| `drop / Drop` | 004 | 重力落下、压扁回弹，底边保持不动：`<Drop f={f} t0={0} x={x} y={y} hb={h / 2}>…</Drop>` |
| `popS / Pop` | 004 | 从零长出再落定：`<Pop f={f} t0={30} x={x} y={y}>…</Pop>` |
| `beatPulse / out` | 004 | 按拍跳动与缩小退场：`beatPulse(f, at, 0.06)` |
| `Sweep / Iris` | 004 | 波浪边底色接力 / 圆形铺满：`<Sweep f={f} t={120} c={nextColor} dir="left" />` |
| `Patterns / Confetti` | 004 | 可滚动纹样和纸屑，颜色由主题注入：`<Patterns f={f} />` |
| `createBurst` | 004 | 带重力的放射纸屑，位于 `particles.tsx`：`createBurst({colors, ink})` |

```tsx
const {Drop, Blk, rect, Sweep} = createBlockKit({C, F, LINE, SHADOW, SQUASH: 0.2});
const Burst = createBurst({colors: [C.red, C.blue], ink: C.ink});
<Drop f={f} t0={20} x={960} y={540} hb={50}><Blk d={rect(240, 100)} fill={C.red} /></Drop>
<Burst f={f} t0={34} x={960} y={590} />
<Sweep f={f} t={120} c={C.blue} />
```

## 001：形状擦除与背景轮换

入口：`src/lib/motion/shape-wipe.tsx`。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `WipeShape` | 001 | `kind=0/1/2` 的圆 / 旋转方 / 三角；`p` 为进度，可传描边，或用作 `clipPath` |
| `triPoints` | 001 | 以重心为原点的三角坐标串：`triPoints(400)` |
| `cycleBackgrounds` | 001 | 为章节依次轮换背景，颜色表不足时循环：`cycleBackgrounds(chapters, colors)` |

```tsx
const chapters = cycleBackgrounds([{from: 0}, {from: 120}], ['#F4F1EA', '#171922']);
<clipPath id="chapter-wipe"><WipeShape kind={1} p={progress} /></clipPath>
<g clipPath="url(#chapter-wipe)">{content}</g>
<WipeShape kind={1} p={progress} fill="none" stroke="#3157D5" strokeWidth={16} />
```

## 布局 02：同一批卡片持续流动

入口：`src/lib/motion/layout-flow.ts` 和 `column-readout.tsx`。原片的卡片内容、布局规格、滚动轨迹与教学覆盖层继续放在 `layouts/02-masonry/video/`。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `masonry` | L02 | 按源顺序放入当前最短列，返回 `rects / heights / col`：`masonry(items, spec)` |
| `createLayoutFlow` | L02 | 输入布局表、转场、主题、滚动函数、空状态与边界，返回 `tileState(f, i)` / `startOf(k, i)` |
| `FLOW / dropEase` | L02 | 流动缓动；重力落下与 4.5% 回弹：`dropEase(progress)` |
| `createColumnReadout` | L02 | 传入强调色与 `sc / mono` 排字函数，生成列高胶囊，最短列突出显示 |

```ts
const placed = masonry(items, {x0: 100, y0: 100, cols: 3, colW: 300, gap: 20, r: 16});
const flow = createLayoutFlow({layouts, transitions, itemCount: items.length,
  themeOf, drift, bounds, emptyName: 'EMPTY', emptyTheme: 'BASE'});
const first = flow.tileState(200, 0); // 被新转场打断时，从当时的状态继续
```

`layouts` 中必须包含空状态和全部转场目的地；各布局的卡片索引要一致。用 `Name / ThemeName` 泛型约束自己的布局与主题。

## 005：拍上去、网点长满与印刷

入口：`src/lib/motion/print.tsx` 的 `createPrintKit({C, F, DOT, LINE, SHADOW, beat})`，以及 `screen-print.tsx`。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `slapS / Slap` | 005 | 1.35 倍在 7 帧内拍到 1：`<Slap f={f} t0={at} x={x} y={y}>…</Slap>` |
| `dotsD / Dots` | 005 | 六角网点，一条路径承载：`dotsD(x, y, w, h, pitch, radiusAt)` |
| `DotWipe` | 005 | 网点逐渐长满并接力下一底色：`<DotWipe f={f} t={at} c={color} dir="radial" />` |
| `burstD / BurstIris` | 005 | 可固定种子的爆炸框及转场：`burstD(300, 200, 16, 0, 'hit')` |
| `Squeegee` | 005 | 丝网刮板，传入位置、方向与颜色：`<Squeegee x={x} reverse={false} ink={ink} color={color} handle={wood} paper={white} />` |
| `flipScale` | 005 | 翻罐时的 `abs(cos)` 横向缩放：`flipScale(f - at, 10)` |
| `Box / Bubble / Bang / Caption` | 005 | 旁白、对话、拟声与章节标注，沿用主题字体和颜色 |

```tsx
const {Slap, DotWipe} = createPrintKit({C, F, DOT: {pitch: 24}, LINE, SHADOW});
const sx = flipScale(f - 80);
<g transform={`scale(${sx} 1)`}>{can}</g>
<Slap f={f} t0={100} x={960} y={540}>{caption}</Slap>
<DotWipe f={f} t={180} c={C.blue} dir="left" />
```

## 015：运动学、残影、排字与采样

`kinematics.ts` 是不依赖 React 或 tokens 的纯函数。`trajectory.tsx` 的 `createTrajectoryKit` 接收配色、字体、残影参数、力线参数、字宽映射和字体度量；示例配置见 `styles/015-futurism/video/kit.tsx`。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `kin` | 015 | 分段匀加速，位置和速度连续：`kin(t, x0, v0, [[0, 0], [100, -1]])` |
| `path1 / hermite` | 015 | 指定速度的连续轨迹：`path1(t, [[0, 0, 0], [30, 500], [60, 800, 0]])` |
| `vel / acc / speed2` | 015 | 任意轨迹的速度 / 加速度：`vel(position, t)` |
| `springOf / leanOf` | 015 | 信号的二阶弹簧响应；由加速度产生惯性前倾：`leanOf(position, t)` |
| `land / anticLand` | 015 | 约 5% 过冲；起势后落地：`anticLand(t, at, 8, 26, 0.08)` |
| `wobble / ballistic / follow` | 015 | 衰减抖动、抛物线、滞后跟随：`follow(target, t, 8)` |
| `track / tw / thump` | 015 | 关键帧、区间缓动、单向下沉；单位均为剧本帧 |
| `Echoes / echoCount / echoAlpha` | 015 | 真实轨迹的过去取样；状态相同时收拢：`<Echoes t={t} state={stateAt} render={renderAt} />` |
| `Word / layout / advOf` | 015 | 逐字排、可变字宽、单字偏移 / 前倾；`<Word text="SPEED" x={x} y={y} size={200} wdth={wdthOf(v)} />` |
| `ForceLines / Wedge / wedgePts` | 015 | 跟随速度的楔形力线，长度、数量和阈值由调用方配置 |
| `Rise` | 015 | 行从嵌套 SVG 遮罩升起，不使用共享 clipPath id：`<Rise t={t} at={0} box={[x,y,w,h]}>…</Rise>` |
| `camT / zoomLerp / mixHex` | 015 | 画面中心镜头、指数推进与 hex 混色 |
| `createSceneSampler` | 015 | 场景登记、重叠时的背景 / 读数 / 最快速度，见 `sampling.ts` |
| `motionBlurTimes` | 015 | 按最快速度取最多 `blur` 个子帧，不跨当前主段边界 |
| `probeChannels` | 015 | 数值曲线通道和可选 `[from,to)` 窗口，窗口外为 NaN，JSON 为 null |
| `write_metrics` | 015 | `scripts/lib/font_metrics.py` 从可变字体生成字宽表；原片 `make_metrics.py` 是调用入口 |
| `motion_curves.mjs / plot_probe.py` | 015 | 导出每帧读数与绘图；支持单 / 多通道、空值、帧区间、`--beat` |

```tsx
const {Echoes, Word, wdthOf} = createTrajectoryKit(theme);
const xAt = (t: number) => path1(t, keys);
<Echoes t={f} state={(t) => [xAt(t)]} render={(t) => (
  <Word text="MOVE" x={xAt(t)} y={600} size={200} wdth={wdthOf(vel(xAt, t))} />
)} />
```

`step / blur / res` 留在每期主合成的 props 中。剧本按 60fps；草稿用 `step:2 / blur:1 / res:0.5`，30fps 合成时长减半。纯 SVG 由 `--scale=0.5` 降低栅格尺寸；新增 Canvas / WebGL 时必须把内部缓冲尺寸乘 `res`，不能只改最终截图大小。

## 配乐：每期只编排事件

入口：`scripts/lib/audio/AudioKit`。实例参数为 `duration / sample_rate / seed / fps / tail`。随机乐器、声效和总线共用一个实例，避免全局 RNG 和不同作品之间串状态。015 的原始事件顺序和所有数值保留。

| 部件 | 来源 | 效果与调用 |
|---|---|---|
| `kick / clap / hat / shaker / crash` | 015 | 鼓组：`audio.place(audio.kick(), audio.fr(25))` |
| `bass / piano / bell / pad / pluck_string` | 015 | 贝斯、钢琴、钟琴、铺底、弹拨弦：`audio.bell(78, 0.7)` |
| `whoosh / riser / boom / thock / click / heel / rip` | 015 | 扫频、上扬、落地、字母、点击、鞋跟、撕纸音效 |
| `engine / screech / slowmo / shimmer / clank / anvil / tom / hiss / glide` | 015 | 引擎、刹车、慢动作、光、金属、铁砧、通鼓、气、滑音 |
| `place / sfx / fr` | 015 | 声像、增益、混响发送与音乐 / 音效独立总线；负时间折到片尾 |
| `sidechain` | 015 | 在指定帧降低音乐总线包络：`audio.sidechain(frame)` |
| `reverb / fft_filter / sweep / saw / env / midi` | 015 | 混响、滤波、扫频、振荡器、包络与音高基础件 |
| `master` | 015 | 侧链混音、余音折回、软饱和、限幅、−14 LUFS 母带与 PCM WAV 输出 |

```python
audio = AudioKit(duration=20.0, seed=20)
audio.place(audio.kick(), audio.fr(30))
audio.sidechain(30)
audio.sfx(audio.thock(69), audio.fr(60), send=0.3)
audio.master(ROOT / 'public/020-example/music.wav')
```

需要 `ffmpeg` 才能做响度测量与 −14 LUFS 母带；未安装时沿用原片峰值缩放回退路径，不能把回退输出标记为响度已核验。

## 修改共用库的完成条件

```sh
npx playwright install chromium
STABLE_RASTER=1 bash scripts/check_reuse.sh out/reuse-verification/before
# 修改后，在同一环境和同一组字体下再运行到 after。
STABLE_RASTER=1 bash scripts/check_reuse.sh out/reuse-verification/after
python3 scripts/compare_media.py out/reuse-verification/before out/reuse-verification/after --report out/reuse-verification/comparison.json
```

每期约 10 帧，包含快动作与换场；比较器解码 PNG 像素和 WAV PCM，任何差异、缺失或额外文件都失败。`STABLE_RASTER=1` 使用已安装的 Playwright 独立测试浏览器（临时 profile），加 CPU 栅格化选项，并在截图前等待字体、CSS 背景解码结束和两次绘制；在完整测试浏览器中使用 Remotion 的视图截图通道，避免将未完成的栅格块当作设计差异。可通过 `BROWSER` 和 `REMOTION_CHROME_MODE` 指定同条件的测试浏览器；不连接个人浏览器或读取登录状态。此模式使用当前锁定的 Remotion 4.0.538 浏览器 / CDP 接口；升级渲染依赖后需要重跑核验。正片默认渲染设置不变。只做静帧可加 `REUSE_STILLS_ONLY=1`。当前稳定核验包装器支持 macOS / Linux；Windows 可用 `BROWSER` 指定等效包装器。

新增通用部件时，把调用入口、来源和约束追加到本文件，并让实际使用它的旧片经过相同回归。现有各期源码、字体许可与引用说明继续保留在原目录。
