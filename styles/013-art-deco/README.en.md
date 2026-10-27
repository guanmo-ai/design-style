# 013 · Art Deco

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-13) · [Making of](PROCESS.en.md)

> English quick guide. The film and SVG artwork keep their original Chinese labels. The [Chinese guide](README.md) has the longer history and frame-by-frame storyboard.

## Overview

Onyx black, ivory, and gold that only ever appears as a line. A 20-second film runs on one rule — mirroring. It opens on its own poster, which slides apart like elevator doors along the center seam; one gold line is left, and a spark of light drops down it. The line becomes three (one thick, two thin), the three lines pull out to the edges as a frame with stepped corners, and a ziggurat tower rises tier by tier while the camera tilts up. Sunburst rays fan open behind it, the crown morphs between Paris 1925, Shanghai 1929 and New York 1930, and the whole tower shrinks into the arched window of a phone app while a web page opens from its own axis. Five rule plaques open from the middle, then the doors close and the film is back on its first frame.

Series: **Design styles**. Period shown: **1925—1939** (Paris 1925 exposition to the eve of World War II).

**The one trick:** *draw the axis first; everything grows left and right at the same time.* Layout, icons, buttons and motion all start from the center line — even the captions split in two halves at the axis.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Axis symmetry** | Draw one vertical line first, then mirror layout, icons and buttons around it. Symmetry needs pairs (wings, corner ornaments, two halves of a sentence), not just a centered column. |
| **Ziggurat steps** | Masses get narrower as they rise. Corners are cut with two steps (6px × 2 in UI), never rounded. |
| **Sunburst** | Hide the light source behind the subject; thin 1px rays radiate from the axis, 18–24 across 180°, wedges filled every other one. A sun filling the screen looks cheap. |
| **One line becomes three** | One thick, two thin, parallel; gap ≈ thick × 3 (UI: 1.8 / 0.8 / 0.8, gap 5). Three equal lines are just stripes. |
| **Gold only for lines** | Gold goes to thin lines, large titles and the **one** solid block you want pressed. Large areas stay onyx or emerald. |

## Project palette and typography

- Onyx `#0E0D0B` (60%); Ivory `#F1E7D2` (25%); Gold `#C9A45A` (10%); Emerald `#0E4A3C` (second base); Lacquer `#9E2B25` (5%); Smoke `#A89F8C`.
- Gold is a material, not a flat color: a diagonal multi-stop gradient, `#F2DC9C → #C9A45A → #7E5E26`, light–dark–light, so even a hairline catches a reflection.
- On onyx: ivory 15.8:1, gold 8.3:1, smoke 7.4:1; onyx text on a gold block is 8.3:1 — all WCAG AAA. Gold as text only at 24px and up.
- Typefaces: Poiret One (titles, +6% tracking and more), Jost (caps labels, 0.24–0.42em), Noto Serif SC (Chinese titles, 0.2–0.5em), Noto Sans SC (Chinese body).
- Tokens: [JSON](tokens.json), [CSS](tokens.css) (includes a ready-made stepped frame and gold button), [TypeScript](tokens.ts).

## Visual references

All four sheets keep their original Chinese labels.

### Art Deco at a glance

![Art Deco at a glance](images/preview/poster.svg)

### Five colors, three typefaces, five motifs, five rules

![Cheatsheet](images/preview/cheatsheet.svg)

### Art Deco in an app

![Jazz bar booking app concept](images/preview/app-ui.svg)

### Five steps from one axis to Art Deco

![Five-step tutorial](images/preview/steps.svg)

## Common mix-ups

- **Not Art Nouveau.** Art Nouveau (1890—1910) is vines, curves and flowers; Art Deco is its opposite — straight lines, steps, machines. If you see plant curves, it is not Deco.
- **Not Bauhaus.** Bauhaus opposed ornament and followed function; Art Deco loves geometry too, but uses it to decorate and to impress.
- **Not “black + gold = luxury”.** Black and gold is only a palette. Without the axis, steps and triple line, it is just a sale poster.

## Timing

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 20 s / 1200 frames |
| Tempo | 120 BPM swing throughout (off-beats land at 2/3 of a beat) |
| Loop | First frame = last frame (the gold highlight sweeps a whole period); the music’s tail folds back into the start, so autoplay loops are seamless |

## Reproduce

```bash
npm run studio
npm run render:013
npm run images:013
```

Open Remotion Studio and select the `S013-ArtDeco` composition.
