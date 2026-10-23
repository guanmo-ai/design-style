# 02 · Masonry

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/layout-02) · [Making of](PROCESS.en.md)

> English quick guide to this episode. Videos and SVG artwork retain their original Chinese labels. The [detailed Chinese guide](README.md) includes the longer history and frame-by-frame storyboard.

## Overview

Equal-width columns, content-driven heights: each card goes into the shortest column. From stone walls and Pinterest boards to two-column feeds, discover masonry in 15 seconds.

Series: **Layouts**. Period shown in this episode: **2009—**.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Equal column widths** | Keep card widths equal while letting their heights follow the content. |
| **Shortest column first** | Place each new card in the shortest column; break ties from left to right. |
| **Equal gaps** | Keep horizontal and vertical gaps equal. Use narrower gaps on small screens. |
| **Original proportions** | Preserve image aspect ratios instead of cropping every card to a square. |
| **Reserve space** | Provide image dimensions or aspect ratios before loading to avoid layout shifts. |

## Project palette and typography

This is the palette used by this project, not a universal specification for every example of Masonry.

- Colors: `#F2EFE9`, `#FFFFFF`, `#141414`, `#6F6A62`, `#0D0E10`, `#17181B`, `#F2462E`, `#E9E2D3`.
- Typefaces: Instrument Serif, Inter / Inter Display, Noto Sans SC, Geist Mono.
- Editable values: [JSON tokens](tokens.json), [CSS tokens](tokens.css), and [TypeScript tokens](tokens.ts).

## Visual references

The four editable diagrams explain the same rules from different angles. Their embedded labels are in Chinese.

### Masonry at a glance

![Masonry at a glance](images/preview/poster.svg)

### Algorithm, breakpoints, ratios, and five rules

![Algorithm, breakpoints, ratios, and five rules](images/preview/cheatsheet.svg)

### The same eight cards in four layouts

![The same eight cards in four layouts](images/preview/compare.svg)

### Portfolio, two-column feed, and product gallery

![Portfolio, two-column feed, and product gallery](images/preview/templates.svg)

## Common pitfalls

CSS multi-column flow fills down a column and can change the apparent reading order. Keep DOM and keyboard order meaningful. Check native masonry support in your target browsers and provide a regular Grid or JavaScript fallback.

## AI image prompt

The original episode includes this English prompt:

```text
Masonry layout (Pinterest-style waterfall grid): 4 equal-width columns of rounded cards with
equal 20px gaps, each card keeps its own aspect ratio (2:3, 4:5, 1:1, 16:9), so card heights vary
and the columns end at different heights; warm off-white background #F2EFE9, white cards, almost
no shadow, editorial photography (still life, architecture, nature), one vermilion accent #F2462E,
a large thin serif headline, calm, airy, gallery wall --ar 4:5
```

## Explore the source

- [Making of: English overview](PROCESS.en.md)
- [Detailed guide in Chinese](README.md)
- [Animation source](video)
- [Music synthesis](audio/make_music.py)
- [Original SVG files](images)
