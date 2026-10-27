# Split Screen · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> A concise English production overview. The [full Chinese production log](PROCESS.md) records the three-way pick, the revisions, the detailed feedback, and additional checks. The released film and process images retain their original labels.

## Design constraint

The film has exactly one protagonist: the dividing line. The picture is always cut into two halves; chapters turn pages like two conveyor belts — the left half slides up, the right half slides down — and every landing hits a beat. The line itself slides between ratios and, once, rotates 90° when a layout stacks.

The film and four reference sheets share the values in `tokens.ts`, `tokens.css`, and `tokens.json`. Typography in this episode uses Archivo, Noto Sans SC, Space Mono.

## Production workflow

1. Present three candidate layouts as posters (split screen, broken grid, stacked cards), each in a different visual treatment, and let the author pick.
2. Read the [English guide](README.en.md) and choose one motion idea per chapter; the five rules map to five demos.
3. Use `process/timeline.json` as the chapter timing reference (40 beats, 1200 frames).
4. Build the stage in `video/` with Remotion and React: each chapter is drawn twice (once per half) and clipped by the dividing line, so a word can cross the line and change color. Layouts in the film are real CSS-like boxes: when the line moves, text reflows for real.
5. Generate the soundtrack with `audio/make_music.py`; the left channel plays a low plucked voice and the right channel a high glassy one, belts sweep in opposite directions on the two channels, and all landings sit on the beat.
6. Build the four reference sheets from the editable files in `images/`. Preview SVGs embed font subsets so they can be viewed independently.
7. Inspect affected frames, contact sheets, the timing chart, and the encoded video. Listening and visual review are separate from automated checks.

## Timing and output

| Property | Project value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Composition duration | 20 seconds |
| Frames | 1200 |
| Tempo | 120 BPM (1 beat = 30 frames) |
| Motion blur | 10 samples, 140° shutter |

## Reproduce locally

From the repository root, after installing the dependencies and fonts described in the [English project README](../../README.en.md):

```bash
npm run studio
npm run render:L03
npm run images:L03
```
