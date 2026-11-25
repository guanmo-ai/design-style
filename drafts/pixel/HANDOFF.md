# 像素风 Pixel Art · 交接单

Claude 交片时填写，Codex 上架时照着做。只写技术事实；审片意见和发布授权记在私有仓库 `works/pixel.md`（见 [`docs/COLLAB.md`](../../docs/COLLAB.md)）。

## 成片

| 项 | 值 |
|---|---|
| 文件 | `drafts/pixel/film/pixel-film.mp4` |
| 来源提交 | 本交接单所在的提交 |
| SHA-256 / 字节 | `0bf6a50f27d754c0d80af253e02c564c3d3bb6fc154f8ac335905f15f37b6ffe` / 6,522,392 |
| 规格 | 1920×1080 · 30fps · 562 帧 · 18.733 秒 · H.264（CRF 16，`-tune animation`）+ AAC 192k 单声道 48 kHz |
| 音频 | -17.0 LUFS / 真峰值 -1.5 dBFS |
| `smooth.py` | 跳变 80 · 死区 0 · 最大 192.3（第 322 帧，卡帧板的反相英雄帧）。逐条核对见 [`film/STORYBOARD.md`](film/STORYBOARD.md) |
| 封面 | `drafts/pixel/film/cover.jpg`（第 0 帧） |
| 风格图 | `drafts/pixel/images/` 五张无损 PNG（1920×1080，一个像素 = 6×6）：`poster.png`（第 561 帧）、`palette.png`（211）、`integer-scale.png`（296）、`hit-stop.png`（380）、`weather-app.png`（470） |

帧率是 30 fps，不是 60：像素风的“形”按 15 fps、“光”按 30 fps 走，60 fps 只会多出重复帧。

## 看过什么、没验证什么

- 看过：每拍一张的全片联系表；第一次钻进灯泡（116–145）、卡帧（318–326）、最后一次换章到收尾（476–561）的连续帧；第 0 帧和最后一帧全尺寸（从成片里解码）；四块板各一帧全尺寸。
- 没看过播放，没听过声音，要主人自己看和听。
- 其他没验证的：手机上的实际观感（正文字 12 px × 6 倍 = 72 px 高）。

## 上架还缺什么

- [ ] 风格图的可编辑版本（现在是渲染器导出的 PNG；数值都在 `film/boards.mjs` 和 `STORYBOARD.md` 里）
- [ ] tokens 与时间轴（色板 23 色、7 条色阶、时间轴都在 `film/film.mjs` 开头和 `STORYBOARD.md`）
- [ ] 中英文风格指南 `README.md` / `README.en.md`
- [ ] 英文制作过程 `PROCESS.en.md`
- [ ] 字体下载与许可：缝合像素字体 12 px 比例宽度，官方 Release 2026.08.11，压缩包地址和 SHA-256 在 `film/glyphs.py` 开头；许可在 `film/fonts/`
- [ ] 第三方代码许可：`film/vendor/pixelfx/LICENSE`、`NOTICE.md`（MIT，Patch 和 Hugo Duprez）随源码一起带上
- [ ] 正式目录 `styles/NNN-pixel/`、Release 附件与 `SHA256SUMS`、画廊 `works.json` 条目

## 复现

```bash
bash drafts/pixel/film/make.sh
bash drafts/pixel/film/stills.sh
```

需要 Node、ffmpeg、Python 3（numpy）。重新生成点阵另需 `fontTools`、`brotli` 和 Pillow：

```bash
python3 drafts/pixel/film/glyphs.py <fusion-pixel-font-12px-proportional-otf.woff2-v2026.08.11.zip> > drafts/pixel/film/glyphs.json
```

## 上架时发现的问题

（Codex 填写，交回 Claude）
