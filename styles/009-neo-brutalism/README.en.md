# 009 · Neo-Brutalism

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-09) · [Making of](PROCESS.en.md)

> English quick guide. The film and SVG artwork keep their original Chinese labels. The [Chinese guide](README.md) has the longer history and frame-by-frame storyboard.

## Overview

Black borders on everything, shadows that are solid offset blocks, flat saturated color. A 15-second film starts from a web page with no CSS and adds the style one line per beat, then teaches each rule as a full-screen card: borders, hard shadows, pressing, and where the look came from — from 1952 raw concrete to 2014 brutalist websites to 2021 product UI.

Series: **Design styles**. Period shown: **2021—today** (roots in 1950s Brutalist architecture).

**The one trick:** *pressing = the element slides onto its shadow, and the shadow goes to zero.* The hard shadow is both the “you can press this” cue and the press animation.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Border everything** | 3–4px solid black on cards, buttons, inputs, images and tags. One radius only: 0, 8, or pill. |
| **Hard shadow** | `box-shadow: 8px 8px 0 #000` — blur is always 0. Buttons 4px, cards 8px; longer shadow = higher in the hierarchy. |
| **Flat color** | Yellow, pink, lime, blue and orange, no gradients. The most important block gets the brightest color. Max three fills per screen. |
| **Show the structure** | Draw the grid, dividers and labels; use a dot-grid background and monospaced numbers. Spacing still sits on an 8px grid. |
| **Tilt one thing** | One sticker or badge may rotate 2–6°. Body text, buttons and forms stay straight. |

## Project palette and typography

- Ink `#000000`; Paper `#FFF6E5`; White `#FFFFFF`; Yellow `#FFD23F`; Pink `#FF8FD6`; Lime `#B8F15A`; Blue `#7AA2FF`; Orange `#FF7A45`.
- Black text passes 7:1 (WCAG AAA) on all five fills; black borders give every fill 3:1 non-text contrast (WCAG 1.4.11).
- Typefaces: Archivo 900 (wide), Space Grotesk, Space Mono, Noto Sans SC; Tinos stands in for the browser-default Times in the “no CSS” scenes.
- Tokens: [JSON](tokens.json), [CSS](tokens.css) (includes a ready-made three-state button), [TypeScript](tokens.ts).

## Visual references

### Neo-Brutalism at a glance

![Neo-Brutalism at a glance](images/preview/poster.svg)

### Five tokens, three button states, five rules

![Cheatsheet](images/preview/cheatsheet.svg)

### Neo-Brutalism in an app

![Budget app concept](images/preview/app-ui.svg)

### Four steps to restyle one card

![Four-step tutorial](images/preview/steps.svg)

## Common mix-ups

- **Not the 2014 “brutalist web”.** That was anti-design: default styles shipped as-is. Neo-Brutalism is a precise system that happens to look blunt.
- **Not Memphis.** Memphis is pattern and squiggle; Neo-Brutalism is interface structure.
- **Not neumorphism.** Neumorphism uses soft same-color emboss with weak contrast — the opposite approach.

## Timing

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 15 s / 900 frames |
| Tempo | 120 BPM (every slam and press lands on a beat or half-beat) |

## Reproduce

```bash
npm run studio
npm run render:009
npm run images:009
```

Open Remotion Studio and select composition `S009-NeoBrutalism`.
