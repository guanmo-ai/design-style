# Isometric · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## Design constraint

Lock the axes, then stack the volume. True isometric is a parallel projection: equal units, no vanishing point, depth from overlap and three-value faces.

The film and four sheets share `tokens.ts` / `tokens.css` / `tokens.json`. Typefaces: Inter Display, Geist Mono, Noto Sans SC.

## Workflow

1. Read the [English guide](README.en.md). The through-line is a method, not a museum tour.
2. Use `process/timeline.json` for chapter timing. Segments cover all 1440 frames.
3. Build `video/` in Remotion. Every box goes through `iso.ts` + `IsoBoxes`.
4. Generate audio with `audio/make_music.py` (NumPy only; no sample libraries).
5. Build the four sheets from `images/make_svgs.py`.
6. Inspect stills, the H.264 master, and loudness.

## Timing and output

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 24 seconds / 1440 frames |
| Tempo | 120 BPM |

## Reproduce

```bash
npm run studio
npm run render:012
npm run images:012
```

Composition id: `S012-Isometric`. This branch does not touch `styles/007-minimalism/`, Paper Cut, Claymorphism, or Card Stack.
