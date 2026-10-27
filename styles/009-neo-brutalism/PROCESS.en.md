# Neo-Brutalism · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## How this episode was chosen

Three candidates were drafted first, each with a poster, a cheatsheet and an app concept: Art Deco, Op Art and Neo-Brutalism. Neo-Brutalism was picked because it is the most immediately useful for interface work — the whole style is a handful of numbers you can paste into CSS. The other two are kept in [`drafts/`](../../drafts) for future episodes.

## Built for Twitter

The first frame is the end card, so it works as the thumbnail and something moves within 0.2 s. First frame = last frame (pixel-identical) and the music's tail folds back into the start, so autoplay loops are seamless. Every rule is written on screen, so it reads with the sound off. The camera does not shake: six key landings get a one-way thud instead.

## Design constraint

Pressing = the element slides onto its shadow and the shadow goes to zero. Every button, card, chip and full-screen chapter in the film is the same `Box` component in `video/ui.tsx`: a black border, a real CSS `box-shadow: Npx Npx 0 #000`, and a press value `p`.

Motion has only two verbs: **slam** (one small overshoot on landing) and **press** (linear, about 100ms, no spring). Chapters are full-screen cards that get pushed away, slammed down from above, pulled up, or stacked — no crossfades.

## Workflow

1. Read the [English guide](README.en.md). The through-line is “a web page with no CSS becomes Neo-Brutalist, one line per beat”.
2. Use `process/timeline.json` for chapter timing. Segments cover all 900 frames; every hit is a frame number on a beat or half-beat.
3. Build `video/` in Remotion: `opening.tsx`, `scenes.tsx` (border, shadow, press, lineage), `finale.tsx` (five words, end card).
4. Generate audio with `audio/make_music.py` (NumPy only; no sample libraries).
5. Build the four sheets from `images/make_svgs.py`.
6. Inspect stills, contact sheets, the timing chart, and frames pulled from the H.264 master.

## Timing and output

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 15 seconds / 900 frames |
| Tempo | 120 BPM |
| Motion blur | 120° shutter, 8 samples |

## Reproduce

```bash
npm run studio
npm run render:009
npm run images:009
```

Composition id: `S009-NeoBrutalism`.

- [Released video](https://github.com/guanmo-ai/design-style/releases/tag/day-09)
