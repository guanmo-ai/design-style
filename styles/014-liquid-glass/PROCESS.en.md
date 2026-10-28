# 014 · Liquid Glass · Making of

[中文](PROCESS.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-14) · [Style guide](README.en.md)

> How this issue went from three candidates to a 20-second film and four images. Process images are in [`process/`](process); reproducible code is in `video/`, `audio/` and `images/`.

## Overview

| # | Step | Output | Files |
|:-:|---|---|---|
| 1 | Pick | Three candidates with three images each: Liquid Glass, 1-bit Dither, Futurism. Liquid Glass was chosen | `drafts/dither`, `drafts/futurism` |
| 2 | Research | Five generations of UI “glass” (2001–2025), five rules, contrast, mix-ups | [`README.en.md`](README.en.md) |
| 3 | Tokens | Glass parameters (bevel / edge / mag / chroma / frost / tint), three thicknesses, five era recipes | `tokens.ts / .css / .json` |
| 4 | Images ×4 | Poster · cheatsheet · music app · five-step tutorial | `images/make_svgs.py`, `images/glass.py` |
| 5 | Film (v3) | The drop → bend → dive → twenty-five years → merge → 3D phone and web → second dive → five rules → back to start | `video/*`, [`STORYBOARD.md`](video/STORYBOARD.md) |
| 6 | Music | 120 BPM, D major, FM glass plucks, −14 LUFS, effects synced to keyframes | `audio/make_music.py` |

![Contact sheet](process/01-contact.jpg)

## Why version 2 was thrown away

Version 2 laid six pages side by side and whip-panned between them while the glass stayed on screen. The owner's verdict was “ordinary motion”. In review: the skeleton was still a slideshow (same layout per chapter, the whip pan just a fancier page turn); almost every move was an interpolation plus a spring, with no anticipation, overlap, tempo contrast or camera depth; the glass never did anything only glass can do; and reviewing stills hides timing problems.

## Version 3: only moves glass can make

- **The drop and the ripple:** the drop rises (anticipation), falls toward the wall shrinking with its shadow converging, splashes, and a wave packet in the shader bends the whole frame.
- **Satellites and necks:** three drops fly as their own group (with their own height and shadow), land, rejoin the main group and are pulled back; inside the smooth-min radius a neck grows.
- **Caustic light pools:** each piece of glass has a height; its shadow shifts and softens with height and contains a focused ring plus a flowing caustic web (the classic iterative water-caustic, with integer time factors so it loops over the film). Only liquid glass gets a pool; the frosted eras do not.
- **Diving through glass:** a lens can blend between two textures. As the camera pushes in, the lens shows the next world; when it covers the frame the plane switches and the covering lens shrinks into the next chapter's protagonist. Used twice.
- **Hops and mid-air morphs** along the timeline, **3D devices** (each screen runs its own glass pass into an FBO, then is mapped onto a perspective quad with a sliding sheen), and **motion blur** on every fast move (2–6 sub-frames, never across a plane switch).

Motion primitives live in `video/motion.ts`: anticipation, a ~5% overshoot landing (analytic damped spring), liquid wobble, ballistic arcs, and a lagged follow — all pure functions of time.

## Eyes on time

- `scripts/motion_curves.mjs` + `scripts/plot_curves.py` export and plot the protagonist's position, size, speed, height and the camera per frame, with beat lines. The first plot caught three bugs invisible in stills: a one-frame position spike at the dive, motion blur mixing two worlds at the plane switch, and a camera lagging so far that the lens left the frame.
- `scripts/stills_batch.mjs` (one bundle, many frames) + `scripts/strip.py` render consecutive-frame film strips for checking anticipation, landings and rhythm.

## Sound

FM glass plucks (modulator ratio 3.5 for inharmonic, glassy partials). Drums enter at f120 and leave before the drop lifts off, so the loop also matches in sound. Effects follow the picture: an inhale, a falling whistle, a heavy “plop” with sub boom and a descending wet sweep for the ripple; three chimes for the satellites flying out, three plops as they land, three rising bloops as they are pulled back; an inhale, whoosh and thump for each dive; one timbre per era; a gooey “glub” for the merge; a click and a short wet sweep for each tap; a chime rising one step per rule. The effects bus sits 4 dB under the music.

## Pitfalls

- Sample **inward** at the rim (convex lens). Sampling outward shows what is outside the glass and looks broken.
- Frost from mipmaps: regenerate mipmaps each frame and take five taps on the matching level.
- Everything is a pure function of the frame number so Remotion can render out of order in parallel.
- Adaptive text reads the content layer before the glass is drawn, with a soft 0.42–0.55 luminance band to avoid flicker.
- A caustic web built from `1 − |sin|` peaks looks like contour lines; the iterative water-caustic formula gives real cells.
- Never motion-blur across a plane switch: speed estimation returns 0 there and sub-frames do not cross it.
- Render targets keep the canvas orientation (flip only when drawing to the screen); overlays are uploaded without premultiplied alpha.
- Embed displacement maps as PNG data URIs; the image build would otherwise convert them to lossy WebP.
