# Art Deco · Making of

[中文](PROCESS.md) · **English** · [English guide](README.en.md)

> Short English production overview. The [Chinese log](PROCESS.md) has sources, revision notes, and checks. The film keeps its original Chinese labels.

## How this episode was chosen

Art Deco was one of the three drafts left over when 009 was selected (Art Deco, Op Art and Neo-Brutalism), and its poster, cheatsheet and app concept were already finished. This episode picks it up directly, which skips a round of candidates. The through-line is the center axis: steps, sunburst and triple line are all just things that grow out of it.

## Why v1 was rejected

v1 was also built on mirroring: everything opened from the axis with a `scaleX` and closed back into it, with a floor indicator as the chapter marker. The owner's verdict after review was that the motion was too ordinary:

- there was only one move, a flat open/close from the axis, with no depth and no light, so it felt like a slideshow;
- every chapter had the same rhythm (grow, hold, caption), so the information density was low;
- the web page / phone segment took 3 seconds and added no new motion.

The brief: motion first, at least on par with design; the web / phone showcase can go.

## v2: one continuous shot, four big moves

The rule is still mirroring, but gold changes from a color into light. The film is a single continuous shot with no fades; each scene hands one object to the next (arched window, tunnel, rose window, kaleidoscope, sun, skyline, plaques rushing at the camera, poster).

| Move | How it works |
|---|---|
| **Light running along the gold lines** | A short dash (`pathLength=1`) travels along the path, wrapped in two wide, faint strokes of the same path as a glow (no filters); a star flare lights where it lands |
| **A true-depth tunnel of triple-line portals** | Each arch is a plane at depth z, scaled by F / (z − camera z); the camera moves at constant speed and passes one every half beat |
| **24-way mirrored kaleidoscope** | Only half of a 15° sector is drawn, then mirrored and rotated into 24 copies with `<use>`, in the manner of a Busby Berkeley overhead shot |
| **Three-layer night skyline** | Three depth layers plus the hero tower, each projected at its own z, with mirrored searchlights; the camera rises up the hero tower, and distant buildings move more slowly. Windows are merged into a single path so thousands stay fast |

Two smaller ones: the rule plaques flip in from the depth (`scaleX = cos θ` plus a `skewY` fake perspective, showing the back plate past 90°), and the closing ART / DECO is stroke-drawn before it is filled with gold.

## Built for Twitter

The first frame is the poster, so it works as the thumbnail; light starts running around the frame within 0.03 s. First frame = last frame (pixel-identical) and the music's tail folds back into the beginning, so autoplay loops are seamless. Every rule is written on the caption plaque, so it reads with the sound off. The camera only pushes, rises and pulls back; it never shakes.

## Design constraint

Mirroring. Everything appears, moves and disappears symmetrically about the central axis, and sound mirrors too: whatever comes in a pair is panned left and right. Captions split in two halves at the axis, so a sentence demonstrates symmetry itself.

Gold is used as light, not as a color: a highlight runs along the line, then a star flare lights where it lands.

## Custom motion blur

Remotion's `CameraMotionBlur` adds each sample with `plus-lighter` at 1/n opacity, and every layer is quantized to 8 bits first. That turns dark gradients into bands: onyx (14, 13, 11) becomes (16, 16, 8), and the background's radial glow turns into greenish rings of 8 levels each. It was replaced with a custom `Blur` that stacks layers normally, with layer k at opacity 1/k, so each step is an exact running average. Static pixels are left untouched, so the first and last frames match pixel for pixel. The master is also tagged `--color-space=bt709`.

## Workflow

1. Read the [English guide](README.en.md). The through-line is “axis first, then grow both ways”.
2. Use `video/timeline.ts` for chapter timing. Segments cover all 1200 frames; every start lands on a beat or a fine subdivision of one.
3. Build `video/` in Remotion: `ArtDeco.tsx` (composition, caption plaque, motion blur, music), `poster.tsx` and `tower.tsx` (poster, tower, sunburst, arched window), `tunnel.tsx`, `kaleido.tsx`, `city.tsx`, `rules.tsx`, and `ui.tsx` (gold, running highlight, star flare, triple-line frame, stepped corners).
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
| Motion blur | 180° shutter, 8 samples (custom `Blur`) |
| Render time | about 7 min for 1200 frames |
| Master size | about 16 MB, tagged bt709 |

## Reproduce

```bash
npm run studio
npm run render:013
npm run images:013
```

Composition id: `S013-ArtDeco`.

- [Released video](https://github.com/guanmo-ai/design-style/releases/tag/day-13)
