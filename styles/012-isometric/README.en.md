# 012 · Isometric

[中文](README.md) · **English** · [Making of](PROCESS.en.md)

> English quick guide. The film and SVG artwork keep their original Chinese labels. The [Chinese guide](README.md) has the longer history and frame-by-frame storyboard.

## Overview

Lock the axes, then stack the volume. A 24-second film treats isometric as a method: a flat card snaps onto 30° axes, extrudes, a product world is stacked brick by brick, then three useful variants sit side by side.

Series: **Design styles**. Period shown: **1822—today**.

This is not the 30° composition axis in [Constructivism (003)](../003-constructivism/README.en.md). That episode locks a 2D design axis. This one locks three spatial axes.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Lock the axes** | Draw 30° / 30° / up (true iso) before any box. One angle set per picture. |
| **Equal scale** | One unit on X, Y, and Z. Do not stretch an axis to fake perspective. |
| **No foreshortening** | Parallels stay parallel. Far faces stay the same size. |
| **Three values** | Light top, mid key side, dark fill side. One light direction. |
| **Depth by layering** | Overlap, ground grid, and shadows — not a vanishing point. |

## Project palette and typography

- Stage `#E8EEF4`; Coral X `#E85D4C`; Mint Y `#1FAE9B`; Indigo Z `#3D5C9E`; Ink `#1B2430`; Cream `#F1E4D0`.
- Typefaces: Inter Display, Geist Mono, Noto Sans SC.
- Tokens: [JSON](tokens.json), [CSS](tokens.css), [TypeScript](tokens.ts).

## Visual references

### Isometric at a glance

![Isometric at a glance](images/preview/poster.svg)

### Axes, three values, and five rules

![Cheatsheet](images/preview/cheatsheet.svg)

### Isometric in an app

![Dashboard world](images/preview/app-ui.svg)

### Classic, military, and product

![Variants](images/preview/variants.svg)

## Timing

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 24 s / 1440 frames |
| Tempo | 120 BPM |

## Reproduce

```bash
npm run studio
npm run render:012
npm run images:012
```

Open Remotion Studio and select composition `S012-Isometric`.
