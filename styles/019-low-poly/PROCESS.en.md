# 019 · Low Poly · Making of

[中文](PROCESS.md) · **English**

🎬 [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-19) · 📐 [Style guide](README.en.md)

> Picked in the same round as 018 Diorama. How a 5-second sample became a 20-second film, and why the score was rebuilt twice.

## Overview

| # | Step | Output |
|:-:|---|---|
| 1 | Pick | "Low poly · origami build" and "Diorama" were both chosen from the fourth round of candidates |
| 2 | 5-second sample | Triangles flip up from paper into a valley; a train arrives |
| 3 | Tokens | Thirteen colours, three shading bands, 1280 / 320 / 80 faces, card flip, 120 BPM |
| 4 | Film | Five chapters + finale, 20 s, pure SVG frames |
| 5 | Score | Version 3: D major electronic future bass |

## Review rounds

| Round | Feedback | Change |
|---|---|---|
| 1 | Chapter 2 also builds bottom-up; make it top-down | Coloured triangles now slam down from the sky, back rows first |
| 1 | The ending stops abruptly; better, cinematic music | A real ending (the valley flips back into paper + title); version 2 score with synthesized orchestra |
| 2 | The music still isn't good; the ending doesn't have to loop | Version 3 score (below); the ending now holds on the title |
| 3 | Always add the author's byline at the end | Byline under the title, added to the design notes |

## Why the score was rebuilt

- Version 2's numpy strings and choir sounded fake — the closer it tried to sound like real instruments, the more obvious the gap.
- Version 3 uses sounds that are synthesizers to begin with (future bass), so nothing has to imitate anything.
- Bar lines start at 0.5 s (a pickup), so the 4.5 s drop lands on a downbeat.
- Both face reductions bit-crush the whole mix, then it snaps back: you hear "fewer faces".
- Sub bass lowered and a mid-bass layer added so it carries on phone speakers.
- The chords circle IV–V–iii–vi and only reach the tonic when the title appears.
- `Mixer.master` gained a `loop` flag (default True, older episodes unchanged).
