# 018 · Diorama · Making of

[中文](PROCESS.md) · **English**

> How this style was picked over several rounds of candidates, and how a 5-second street-corner sample became a 20-second film with a score. Code is in `video3d/`, `audio/` and `images/`; candidates and samples are in `drafts/`.

## Overview

| # | Step | Output |
|:-:|---|---|
| 1 | Pick | Four rounds of candidates (two images + one "unique motion" line each); low poly and diorama were both chosen |
| 2 | 5-second sample | A street corner built from falling pieces; recoloured twice, ground rebuilt once |
| 3 | Tokens | Eleven colours, long lens + tilt-shift, slam physics, 120 BPM |
| 4 | Film | Five chapters + finale + rewind, 20 s, seamless loop |
| 5 | Score | F major, 120 BPM, cinematic; SFX aligned to `events.json`; −14 LUFS |
| 6 | QA | Half-resolution previews, key frames, first/last frame comparison |

## Why it moves this way

- **Frame 0 already moves.** Version 1 spent over a second laying floor tiles; version 2 starts with soil chunks tumbling and the camera pulling back, and the café is up at 0.55 s.
- **Slam = free fall + squash.** `t²` fall for 60% of the time, 16% squash on landing, `easeOutBack(1.2)` rebound (≈5% overshoot), scaled from the base so blocks never sink into the ground; a puff of dust on each landing.
- **Camera thump.** On each base's first landing the camera dips and rebounds, with a timpani hit on the same beat.
- **One table, one camera.** All three bases sit on one table; the camera slides between them and pulls back at night to show all three.
- **The screen closes into a phone.** `setViewOffset` shifts the render right while a cream "hole" shrinks from full frame to a phone screen — the model keeps rendering inside it.
- **A real ending.** Push into the lit room window, title rises over a string tutti, the lamp clicks off at 18.6 s; then a tape stop, every piece rewinds back into the sky, and frame 20 s equals frame 0.

## Pitfalls

| Problem | Fix |
|---|---|
| Instanced shards invisible | Bounding sphere computed while all instances were hidden: `frustumCulled = false` |
| Grey squares on large plates at grazing angles | GTAO artefact: off while the base builds, fade in after |
| Text overlay crowded in previews | DOM overlay is laid out at 1920 px: preview at 1920×1080 with pixel ratio 0.5 |
| Occasional 30 s screenshot timeout | Timeout raised to 300 s; `RESUME=1` skips frames already rendered |
