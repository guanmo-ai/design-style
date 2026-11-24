# 朋克复印机 · 配乐提示词（第五版）

画面每个动作都卡在拍上，配乐需要**有停顿、有重击、有落点**，不要从头到尾一样响。时长 20 秒（片子 18 秒，留 2 秒余量），纯器乐，不要人声。

## 提示词（英文，直接粘贴）

```
20-second instrumental for a fast motion-graphics edit. Punk rock meets electronic breakbeat, 150 BPM, 4/4.
Raw distorted power-chord guitar, punchy live drums, overdriven bass, short stabs, no vocals.
Very rhythmic and percussive, made for hard cuts: tight stop-time hits, gaps of silence between hits, snare rolls, risers and big impacts.
Structure:
0-1s: one loud hit then the full band starts immediately (no slow intro, no fade in).
1-6s: driving groove, every 2 bars a full-band stop with a single crash hit.
6-7.5s: drums drop out, only a ticking hi-hat and a rising noise sweep that speeds up (build-up).
7.5s: huge drop, the loudest moment, full band slams back in.
7.5-13s: energetic, busy drum fills, quick guitar stabs on off-beats.
13s: one big accent hit, then a short half-time section.
16-17s: snare roll accelerating.
17s: final massive stop hit, then let the guitar and cymbal ring out to silence by 19s.
Dynamic, punchy, clear transients, lots of contrast between loud and silent. Not a flat wall of sound.
```

## 中文对照（给自己看）

| 秒 | 想要的声音 | 画面那时在做什么 |
|---|---|---|
| 0—1 | 一记重击，全乐队立刻进来，不要慢慢起 | 封面，复印机灯管扫过 |
| 1—6 | 律动，每 2 小节一次全停 + 一下镲 | 阈值、网点：每一下换一张照片、换一种纸 |
| 6—7.5 | 鼓退下去，只剩踩镲和越来越快的上扬噪声 | 复印机合盖，灯越扫越快 |
| 7.5 | 全曲最响的一下 | 出纸 |
| 7.5—13 | 密的鼓点、反拍上的吉他短切 | 一张张复印件吐出来、撕开、换纸 |
| 13 | 一记重音，之后半速 | 拉远到整面墙 |
| 16—17 | 军鼓滚奏加速 | 片名字母一个个拍上来 |
| 17 | 最后一下重停，余音到 19 秒 | 订上署名 |

## 生成之后

- 生成 2—3 个变体，挑**开头 0.3 秒内就有声音**、**6—7.5 秒确实安静下来**、**7.5 秒那一下最响**的那条。
- 拍子不用正好 150。拿到文件放进 `drafts/punk/film/music/`，Claude 会量拍子和落点，再把画面重新卡上去（时间轴按拍写，改 BPM 和起点就能整体对齐）。
