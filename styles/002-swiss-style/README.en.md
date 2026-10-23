# 002 · Swiss Style

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-02) · [Making of](PROCESS.en.md)

> English quick guide to this episode. Videos and SVG artwork retain their original Chinese labels. The [detailed Chinese guide](README.md) includes the longer history and frame-by-frame storyboard.

## Overview

One grid, one typeface, one red. A 15-second film uses the same 12-column grid for headlines, typography, posters, New York subway signs, and five key principles.

Series: **Design styles**. Period shown in this episode: **1950—1970**.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Grid first** | Place type and blocks on a consistent modular grid before adding detail. |
| **One sans serif** | Use a restrained type family and create hierarchy with size and weight. |
| **Flush left** | Align text to the left with a natural ragged right edge. |
| **Asymmetry** | Let a headline or one red block lead; balance it with generous empty space. |
| **Clarity** | Prioritize facts and readable structure. Keep decorative effects out of the information hierarchy. |

## Project palette and typography

This is the palette used by this project, not a universal specification for every example of Swiss Style.

- Colors: `#F5F4F0`, `#111111`, `#E30613`, `#7A7A78`, `#0F0F0F`.
- Typefaces: TeX Gyre Heros, Noto Sans SC.
- Editable values: [JSON tokens](tokens.json), [CSS tokens](tokens.css), and [TypeScript tokens](tokens.ts).

## Visual references

The four editable diagrams explain the same rules from different angles. Their embedded labels are in Chinese.

### Swiss Style at a glance

![Swiss Style at a glance](images/preview/poster.svg)

### Grid, palette, typography, and five rules

![Grid, palette, typography, and five rules](images/preview/cheatsheet.svg)

### Swiss Style in an app

![Swiss Style in an app](images/preview/app-ui.svg)

### One grid, four arrangements

![One grid, four arrangements](images/preview/grid.svg)

## Common pitfalls

Swiss Style is broader than a single typeface. This project uses the open-source TeX Gyre Heros rather than distributing Helvetica. A grid can support many arrangements; it does not require a centered or monotonous page.

## AI image prompt

The original episode includes this English prompt:

```text
Swiss International Typographic Style poster, 1958 Zurich, strict modular grid with square modules,
one bold neo-grotesque sans-serif (Helvetica / Akzidenz-Grotesk), flush-left ragged-right text, huge tight headline,
asymmetric layout with large white space, only black #111111 and Swiss red #E30613 on off-white paper #F5F4F0,
small factual info block (date, place, time), objective, no illustration, no gradients, no shadows --ar 4:5
```

## Explore the source

- [Making of: English overview](PROCESS.en.md)
- [Detailed guide in Chinese](README.md)
- [Animation source](video)
- [Music synthesis](audio/make_music.py)
- [Original SVG files](images)
