# Art Deco · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## How this episode was chosen

Art Deco was one of the three drafts left over when 009 was selected (Art Deco, Op Art and Neo-Brutalism), and its poster, cheatsheet and app concept were already finished. This episode picks it up directly, which skips a round of candidates. The through-line is the center axis: steps, sunburst and triple line are all just things that grow out of it.

## Built for Twitter

The first frame is the poster, so it works as the thumbnail; the center seam lights up within 0.07 s and the doors start sliding within 0.23 s. First frame = last frame (the gold highlight sweeps a whole period, so the phase returns to the start) and the music's tail folds back into the beginning, so autoplay loops are seamless. Every rule is written on screen, so it reads with the sound off. The camera only tilts up while the tower grows and pulls back once; it never shakes.

## Design constraint

Mirroring. Everything opens from the central axis and closes back into it: entrances are `scaleX 0 → 1` with about 5% overshoot, exits fold back onto the axis. Captions split in two halves at the axis — the left half right-aligned, the right half left-aligned, sliding out together — so a sentence demonstrates symmetry itself.

One gold line relays through the whole film instead of cutting: poster seam → a falling spark → one line becomes three → the three lines pull out into the frame → the tower's center rib → the spire → the arched window → the phone's header → back into the seam of the closing doors. The whole film is an elevator ride: the floor indicator at the top is the chapter marker.

## Workflow

1. Read the [English guide](README.en.md). The through-line is “axis first, then grow both ways”: every element opens from the center and closes back into it.
2. Use `video/timeline.ts` for chapter timing. Segments cover all 1200 frames; every start lands on a beat or a fine subdivision of one.
3. Build `video/` in Remotion: `ArtDeco.tsx` (axis, frame, mirrored captions, floor indicator), `tower.tsx` (tower, three crowns, sunburst, arched window), `apps.tsx` (web page + phone app), `finale.tsx` (poster, doors, five rules).
4. Generate audio with `audio/make_music.py` (NumPy only; no sample libraries): swing jazz with left/right mirrored sound effects.
5. Build the four sheets from `images/make_svgs.py`.
6. Inspect stills, contact sheets, the timing chart, and compare the first and last frames.

## Timing and output

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 20 seconds / 1200 frames |
| Tempo | 120 BPM swing, F major |
| Loudness | −14 LUFS |
| Motion blur | 120° shutter, 6 samples |
| Render time | about 2 min 20 s for 1200 frames |
| Master size | about 8 MB |

## Reproduce

```bash
npm run studio
npm run render:013
npm run images:013
```

- [Released video](https://github.com/guanmo-ai/design-style/releases/tag/day-13)
