# Claymorphism · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## Design constraint

Pinch the volume first, then draw the interface. Fat radius + paired inner/outer shadows are the material. One peach clay object relays every scene.

The film and four sheets share `tokens.ts` / `tokens.css` / `tokens.json`. Typefaces: Fredoka, Noto Sans SC, JetBrains Mono.

This branch does not touch `styles/010-*` (papercut is parked) or `styles/007-minimalism/`.

## Workflow

1. Read the [English guide](README.en.md). The through-line is a pinch, not a slide deck.
2. Use `process/timeline.json` for chapter timing. Six 4-second segments cover all 1440 frames.
3. Build `video/` in Remotion. Every clay object goes through `ClayShape` in `clay.tsx`.
4. Generate audio with `audio/make_music.py` (NumPy only; no sample libraries). Soft attack, −14 LUFS.
5. Build the four sheets from `images/make_svgs.py`.
6. Inspect stills, loudness, and the H.264 master.

## Timing and output

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 24 seconds / 1440 frames |
| Tempo | 120 BPM |

End card (aligned to `styles/008-risograph` `End`): *Claymorphism* / 粘土拟态 / 「先捏体积，再画界面。」 / `DESIGN STYLE  011` · `@guanmo_ai` · `github.com/guanmo-ai/design-style`.

## Reproduce

```bash
npm run studio
npm run render:011
npm run images:011
```

Composition id: `S011-Claymorphism`.
