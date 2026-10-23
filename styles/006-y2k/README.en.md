# 006 · Y2K Futurism

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-06) · [Making of](PROCESS.en.md)

> English quick guide to this episode. Videos and SVG artwork retain their original Chinese labels. The [detailed Chinese guide](README.md) includes the longer history and frame-by-frame storyboard.

## Overview

At the turn of the millennium, people built their hopes for “the year 2000” into computers, phones, and screens: chrome, jelly, and translucent plastic. The future was loading. An 18-second film in which chrome, jelly, bubbles, and glass are lit frame by frame by a WebGL2 shader: from a boot screen and wide chrome lettering to the translucent iMac G3, the Aqua interface, 12 × 12 pixel emoji, the millennium bug countdown, and today’s Liquid Glass.

Series: **Design styles**. Period shown in this episode: **1997—2004**.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Chrome** | Chrome is a curved landscape: sky above (blue to white), one brightest horizon line, dark ground below. Stops: `#2A4FB8` 0% · `#9DB6EE` 32% · `#FFFFFF` 49% · `#1A2236` 51% · `#3B4458` 75% · `#A9B3C6` 100%. The sudden break between 49% and 51% is what reads as metal; a light-to-dark grey gradient reads as plastic. |
| **Jelly** | Translucent body, one hard-edged highlight near the top left (like a reflected window), and a glow of caustic light near the bottom. Thicker areas get deeper color. |
| **Technical ground** | Cool silver background with 2px pinstripes, an 80px grid, rulers, registration marks, barcodes, and serial numbers, kept at 5—10% opacity so they never compete with the subject. |
| **Pixel type + wide type** | Pixel type (Silkscreen) for readouts, status, and time; wide geometric type (Unbounded / Michroma) for headlines. Align pixel type to whole pixels and never set body text in it. |
| **Mostly silver, a little lime** | Silver and grey cover about 80% of the frame, Aqua blue marks the active parts (buttons, progress, selection), and neon lime appears only for “passed”: COMPLIANT, check marks, SYSTEM READY. |

## Project palette and typography

This is the palette used by this project, not a universal specification for every example of Y2K design.

- Colors: `#C9CED8`, `#EEF0F4`, `#D9DEE6`, `#0A1633`, `#5E6880`, `#1E6FF0`, `#7DC0FF`, `#0095B6`, `#C8F53C`; traffic lights `#E0443A`, `#F2B53A`, `#4DBA3F`; five jelly flavors `#1D7FD0`, `#E5336F`, `#F5891F`, `#7442A8`, `#6CC13A`.
- Typefaces: Unbounded, Michroma, Silkscreen, Noto Sans SC.
- Editable values: [JSON tokens](tokens.json), [CSS tokens](tokens.css), and [TypeScript tokens](tokens.ts).

## Visual references

The four editable diagrams explain the same rules from different angles. Their embedded labels are in Chinese. Chrome, jelly, bubbles, and glass in these sheets are rendered by the same shader as the film.

### Y2K Futurism at a glance

![Y2K Futurism at a glance](images/preview/poster.svg)

### Four materials, chrome stops, palette, typography, UI parts, and five rules

![Four materials, chrome stops, palette, typography, UI parts, and five rules](images/preview/cheatsheet.svg)

### Y2K in an app

![Y2K in an app](images/preview/app-ui.svg)

### Four steps from a plain poster to Y2K

![Four steps from a plain poster to Y2K](images/preview/steps.svg)

## Common pitfalls

Y2K is not cyberpunk or vaporwave: it is daylight, optimistic, and silver rather than neon purple at night. It is also not Frutiger Aero (about 2004—2013), which followed with water drops, leaves, and softer glass. Chrome has almost no color of its own; what you see is the environment it reflects.

## AI image prompt

The original episode includes this English prompt:

```text
Y2K futurism poster, 1999-2001 tech aesthetic, a huge liquid chrome 3D logo "Y2K" with a sharp horizon line reflection
(blue sky above, bright white horizon, dark ground below), floating translucent Bondi blue jelly spheres with hard window-shaped
highlights and bright caustics at the bottom, soap bubbles with iridescent thin-film colors, a silver aluminum background with
2px pinstripes and a faint 80px grid, registration marks, rulers, a barcode, an Aqua-style window with pinstripe title bar and
red yellow green traffic lights, a glossy blue gel progress bar, small pixel font readouts "LOADING 99%", wide geometric typography,
colors #C9CED8 #EEF0F4 #1E6FF0 #0095B6 #0A1633 with one tiny accent of neon lime #C8F53C, clean studio lighting,
no neon purple, no cyberpunk night scene, no brand logos --ar 4:5
```

## Explore the source

- [Making of: English overview](PROCESS.en.md)
- [Detailed guide in Chinese](README.md)
- [Animation source](video)
- [Material shader](video/material.js)
- [Music synthesis](audio/make_music.py)
- [Original SVG files](images)
