# 维也纳分离派 · 交接单

Claude 交片时填写，Codex 上架时照着做。只写技术事实；审片意见和发布授权记在私有仓库 `works/secession.md`（见 [`docs/COLLAB.md`](../../docs/COLLAB.md)）。

## 成片

| 项 | 值 |
|---|---|
| 文件 | `drafts/secession/film/secession-film.mp4` |
| 来源提交 | 本交接单所在的提交（分支 `claude/dazzling-maxwell-alvsrk`） |
| SHA-256 / 字节 | `d33aef52826bcdd8e7303041aef1bd8f16f9e62d0692d401c5b1b1e452580c7f` · 26,004,528 字节 |
| 规格 | 1920×1080 · 60fps · 1170 帧 · 19.50 秒 · H.264 CRF 18 + AAC 192k |
| 音频 | -14.0 LUFS / -2.3 dBTP；配乐《Gilded Precision》（生成的纯音乐，`film/music/`）+ 代码合成的音效 |
| `smooth.py` | 跳变 19（都在有意的快转场上，见分镜末尾）· 死区 0 · 最大 69.8 @ 第 358 帧 |

## 看过什么、没验证什么

- 没看过播放，没听过声音，要主人自己看和听。
- 看过：全片每 18 帧联系表（`film/contact.jpg`），甩镜、方形光圈、合回三段每 3 帧的连续帧，十个关键帧的全质量单帧，成片里解码出来的两帧细节。
- 其他没验证的：配乐的授权条款以生成平台为准，上架前确认可以商用。

## 上架还缺什么

- [ ] 四张风格图（可编辑 SVG + PNG）
- [ ] tokens 与时间轴
- [ ] 中英文风格指南 `README.md` / `README.en.md`
- [ ] 中英文制作过程 `PROCESS.md` / `PROCESS.en.md`
- [ ] 字体下载与许可（Jost、Noto Serif SC、站酷庆科黄油体；英文标题和数字是 `secession.py` 画的线条字）
- [ ] 正式目录 `styles/NNN-secession/`、Release 附件与 `SHA256SUMS`、画廊 `works.json` 条目

## 复现

```bash
bash drafts/secession/film/make.sh
```

## 上架时发现的问题

（Codex 填写，交回 Claude）
