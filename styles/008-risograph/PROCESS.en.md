# Risograph · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## Design constraint

One ink, one plate; plates multiply. Misregistration, grain, and the third color in an overlap are features of the machine, not decoration.

The film and four sheets share `tokens.ts` / `tokens.css` / `tokens.json`. Typefaces: Archivo, Space Mono, Noto Sans SC.

## Workflow

1. Read the [English guide](README.en.md). The through-line is a print run, not a slide deck.
2. Use `process/timeline.json` for chapter timing. Segments cover all 900 frames.
3. Build `video/` in Remotion. Every colored layer goes through `Plate` in `riso.tsx`.
4. Generate audio with `audio/make_music.py` (NumPy only; no sample libraries).
5. Build the four sheets from `images/make_svgs.py`.
6. Inspect stills, a contact sheet, the timing chart, and the H.264 master.

## Timing and output

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 15 seconds / 900 frames |
| Tempo | 120 BPM |

## Reproduce

```bash
npm run studio
npm run render:008
npm run images:008
```

Composition id: `S008-Risograph`. This branch does not touch `styles/007-minimalism/`.
