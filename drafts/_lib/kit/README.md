# kit · 做片子的组件

从毛绒那一期（主人认可的成片）拆出来的。**通用组件**在这个目录，**专用组件**在旁边的 `fur/`，**声音和工具**在上一层 `_lib/`。

> 这是工具箱，不是模板化的片子。每一块都可以不用；片子的章节顺序、有没有规则卡、有没有手机章，组件不替你决定（见 [`docs/DESIGN_NOTES.md`](../../../docs/DESIGN_NOTES.md) 开头）。

## 起一条新片

```bash
node drafts/_lib/kit/new_film.mjs <英文短名> "<标题>"     # 或 npm run new:film -- <英文短名> "<标题>"
```

生成 `drafts/<短名>/film/`：一支能直接渲的 8 秒小片（一颗珠子带着一圈晚半拍的小珠子），时间轴、场景、HUD、配乐、出片脚本都接好了。

```bash
PREVIEW=1 bash drafts/<短名>/film/make.sh
```

```bash
bash drafts/<短名>/film/make.sh
```

预览约 2 分钟（云端，不含毛的舞台 0.4 秒 / 帧）。出片脚本最后会自动量一遍“丝滑”。

## 有什么

| 文件 | 给你什么 | 依赖 |
|---|---|---|
| `motion.js` | `clamp / lerp / prog / ease / spring / pop / squash`；矩阵 `M`、`about / sq / popIn`；`KIT.springKernel` + `springPoses`：**主体停了，附属物晚半拍、冲过头、抖回来**——不做模拟，每帧仍是帧号的纯函数 | 无 |
| `director.js` | `camAt`（镜头关键帧，推拉按等比走）、`colorAt`（颜色接力）、`morphAt`（形状之间的转场）、`hexMix / mixObj`、`chapterAt`、`xf / proj`（3D ↔ 屏幕）、`wallCam`（正对一面墙的镜头 + 让 DOM 跟着缩放） | motion |
| `stage.js` | `STAGE.create(canvas)`：无缝背景墙 + 地面软影 → *你的渲染器* → 亮珠子 → 泛光 / 调色 / 颗粒。`frame → begin → …你画… → beads → end` | motion |
| `hud.js` + `hud.css` | `HUD.chapter / params / ruleCard / count / callout / phone / cursor / endCard`：章节外框、参数、规则卡、大数字、标注线、手机框和说明块、手指、片尾署名。所有字都“解码”出来并登记声音 | motion、director、`../typefx.js` |
| `shapes.js` | `SHAPES.fromPrims`（椭球 / 胶囊 / 旋转体）、`fromMask`（把字、心形、图标“充气”）、`merge`：把形状变成 N 个均匀的点（位置 + 法线 + 零件号 + 色号） | `../glkit.js`（只有 fromMask 要） |
| `template/` + `new_film.mjs` | 新片的空架子 | 上面全部 |
| `../fur/fur.js` | **专用**：毛绒渲染器（一根根的细带、Kajiya–Kay、成撮、逆光镶边、弹簧滞后、形状之间飞、被手拨开）。毛、草、地毯、毛线、羽毛、流苏用得上 | motion、stage |
| `../softfx.py` | 噗、啵、刷过去、弹簧音、软的落地：`class MySong(Song, SoftFX)` | `../song.py` |
| `../song.py` | 一整首歌的骨架（鼓、贝斯、铺底、琶音、主旋律、换章、出字的“嗒”和砸字） | `scripts/lib/audio` |
| `../film-gl.cjs` `../events.cjs` `../contact.py` `../smooth.py` | 逐帧渲染（可续渲）、导出出字时间、联系表、量跳变和死区 | — |
| `../audiocheck.py` | 量配乐：响度、峰值、噪音感、律动、空洞，和毛绒并排比（BGM 音效是必须守的第 5 条） | ffmpeg |

每个文件开头的注释写了用法；参数的含义写在函数上面。

## 换一种风格，要换什么

| 你要做的 | 换什么 | 留什么 |
|---|---|---|
| 也是“很多根细东西”（草地、毛线、羽毛、地毯） | 形状、色板、每个零件的姿态、文字、和弦。照 [`drafts/plush/film/scenes.js`](../../plush/film/scenes.js) 改 | `fur.js` 和全部通用组件 |
| 另一种 3D 材料（玻璃、金属、粒子、纸） | 写自己的渲染器，在 `st.begin` 和 `st.end` 之间画（模板里标了位置）。要用镜头就用 `c.VP`，要光就用 `c.key` | 舞台、动作、导演、HUD、声音、出片 |
| 2D / 平面风格（Canvas 2D、SVG、DOM） | 不用 `stage.js`，自己画 | `motion.js`、`director.js`（颜色接力、章节、转场的时间逻辑）、`hud.js`、声音、出片 |
| 只是想要某一个效果 | 单独拿那个文件 | — |

渲染器需要满足的只有一条：**每一帧是帧号的纯函数**（`window.frame(f)` 画第 f 帧，和之前画过什么无关）。这样才能并行渲、断点续渲、只重渲改过的那几帧。

## 拆的时候怎么保证没拆坏

毛绒的成片是主人认可的，所以拆完用拆过的代码重渲了 18 帧：17 帧与成片逐字节一致，另 1 帧只有标注线上 12 个像素的亚像素差（拆之前的代码单独渲这一帧结果相同）；配乐重新合成后与成片音轨逐样本一致。以后改这些组件，也用同样的办法对一遍：每隔 79 帧渲一张（16 张，约 1 分钟），和仓库里记下的校验值比。

```bash
cd drafts/plush/film && rm -rf /tmp/plush-check && node ../../_lib/film-gl.cjs film.html /tmp/plush-check 0 1200 2 79 && (cd /tmp/plush-check && sha256sum -c "$OLDPWD/frames.sha256")
```

16 行都是 OK 才算没改坏（校验值是在云端会话的软件渲染下记的；换了机器或显卡，像素可能差一点，那时改用肉眼对联系表）。
