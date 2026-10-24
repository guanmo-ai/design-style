# Card Stack · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> A concise English production overview. The [full Chinese production log](PROCESS.md) records the intent, timing, and checks. The film and process images retain their original labels.

## Design constraint

Show 3–4 rounded cards in a stack. Only the top sheet is in focus: a light lift, a 1–2° rotation, and quieter layers behind it. v1 (one dashboard stack re-skinned) was vetoed for low density; v2 walks the same four cards through iOS Wallet, Stripe / Linear, a paper-stack metaphor, an exploded z-axis, five bilingual rules, and a bad→good pit.

The film and four reference sheets share the values in `tokens.ts`, `tokens.css`, and `tokens.json`. Typography uses Inter / Inter Display, Noto Sans SC, and Geist Mono.

## Production workflow

1. Read the [English guide](README.en.md) and choose one visual idea for each chapter.
2. Use `process/timeline.json` as the chapter timing reference.
3. Build the animation in `video/` with Remotion and React. The four cards persist for the whole film.
4. Generate the soundtrack with `audio/make_music.py` (NumPy only, no external samples).
5. Build the four reference sheets from `images/`. Preview SVGs embed font subsets.
6. Inspect affected frames, a contact sheet, the timing chart, and the encoded video.

## Timing and output

| Property | Project value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Composition duration | 22 seconds |
| Frames | 1320 |
| Tempo | 120 BPM |

## Reproduce locally

From the repository root, after installing the dependencies and fonts described in the [English project README](../../README.en.md):

```bash
npm run studio
npm run render:L03
npm run images:L03
```

The render command first generates the music and then renders the composition.

## Process images

![Storyboard](process/01-storyboard.jpg)

![Motion](process/02-motion.jpg)

## Files and further reading

- [English design guide](README.en.md)
- [Full production log in Chinese](PROCESS.md)
- [Timing data](process/timeline.json)
- [Animation source](video)

When sharing the film or artwork, credit **Guanmo / @guanmo_ai**.
