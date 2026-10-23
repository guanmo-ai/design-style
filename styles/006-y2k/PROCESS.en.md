# Y2K Futurism · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> A concise English production overview. The [full Chinese production log](PROCESS.md) records the revisions, detailed feedback, and additional checks. The [Chinese step-by-step workflow](MAKING.md) lists every tool and command. The released film and process images retain their original labels.

## Design constraint

Chrome must carry a horizon line, and jelly must transmit light with a hard-edged highlight. Keep the frame mostly silver, mark the active parts in Aqua blue, and save neon lime for “passed”.

The first candidate artwork was rejected in review as too ordinary: its chrome was a painted gradient. This episode therefore starts with a material renderer. `video/material.js` is a hand-written WebGL2 shader that turns a signed distance field into a bevelled height field and then into chrome, jelly, bubbles, or glass lit by a sky, horizon, and ground environment. The film and the four reference sheets use the same shader, so they cannot drift apart.

The film and the reference sheets share the values in `tokens.ts`, `tokens.css`, and `tokens.json`. Typography in this episode uses Unbounded, Michroma, Silkscreen, and Noto Sans SC.

## Production workflow

1. Read the [English guide](README.en.md) and choose one material or interface idea for each chapter: chrome, jelly, Aqua, pixel emoji, the millennium bug, and today’s glass.
2. Use `process/timeline.json` as the chapter timing reference. Its segments cover the entire composition: opening, six chapters, five rules, and ending, four beats each.
3. Build the material renderer first, then the animation in `video/` with Remotion and React. Interface parts are SVG; materials are drawn into a canvas each frame.
4. Generate the soundtrack with `audio/make_music.py`; the project synthesizes its music and effects (boot chime, modem noise, bubble pops, glass bells) with Python and NumPy.
5. Build the four reference sheets: `images/make_svgs.py` writes the SVGs and material layer settings, `images/render_layers.mjs` renders the material layers with the film’s shader, and preview SVGs embed font subsets so they can be viewed independently.
6. Inspect affected frames, a contact sheet, the timing chart, and the encoded video. Listening and visual review are separate from automated checks.

## Timing and output

| Property | Project value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Composition duration | 18 seconds |
| Frames | 1080 |
| Tempo | 120 BPM (one beat = 30 frames) |

## Reproduce locally

From the repository root, after installing the dependencies and fonts described in the [English project README](../../README.en.md):

```bash
npm run studio
npm run render:006
npm run images:006
```

The render command first generates the music and then renders the composition. It uses `--gl=swangle` (ANGLE with SwiftShader software rendering) so the WebGL2 shader works on machines without a GPU, which makes rendering slow. The downloadable release is a separate encoded artifact; check its actual media properties rather than assuming byte-for-byte equality with a local render.

## Process images

![Production reference 1](process/02-opening.jpg)

![Production reference 2](process/03-transitions.jpg)

![Production reference 3](process/01-contact.jpg)

## Files and further reading

- [English design guide](README.en.md)
- [Full production log in Chinese](PROCESS.md)
- [Step-by-step workflow in Chinese](MAKING.md)
- [Timing data](process/timeline.json)
- [Animation source](video)
- [Material shader](video/material.js)
- [Released video](https://github.com/guanmo-ai/design-style/releases/tag/day-06)

When sharing the film or artwork, credit **Guanmo / @guanmo_ai**.
