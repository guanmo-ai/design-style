# Paper Cut · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> A concise English production overview. The [full Chinese production log](PROCESS.md) records decisions and checks. The [Chinese step-by-step workflow](MAKING.md) lists tools and commands.

## Design constraint

One color per sheet, depth only in the gap shadow, motion as parallax. Far layers stay almost still; near layers follow the hand. The same landscape never leaves the frame — it is restaged as an editorial poster, an app illustration, and a brand title.

The film and the four reference sheets share `tokens.ts`, `tokens.css`, and `tokens.json`. Typefaces: Jost, Noto Sans SC, JetBrains Mono. Images are path-drawn SVG, not model-generated pictures.

## Production workflow

1. Read the [English guide](README.en.md) and lock one job for each chapter: stack, edit, scroll, fly-through, rules, pitfalls.
2. Use `process/timeline.json` as the chapter clock: 24 seconds, 120 BPM, 32-frame overlapping paper wipes. The last chapter is a stamp, not a title card.
3. Build the shared `World` first (`video/layers.tsx`), then scene chrome in `video/`.
4. Generate the soundtrack with `audio/make_music.py` (NumPy, −14 LUFS).
5. Build the four sheets with `images/make_svgs.py` and `scripts/build_images.py`.
6. Inspect frames, a contact sheet, the timing chart, and the encoded preview. The master file stays out of git.

## Timing and output

| Property | Project value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 24 seconds / 1440 frames |
| Tempo | 120 BPM (one beat = 30 frames) |

## Reproduce locally

```bash
npm run studio
npm run render:010
npm run images:010
```

When sharing the film or artwork, credit **Guanmo / @guanmo_ai**.
