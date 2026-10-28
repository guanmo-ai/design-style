# 014 · Liquid Glass

[中文](README.md) · **English** · [Watch the film](https://github.com/guanmo-ai/design-style/releases/tag/day-14) · [Making of](PROCESS.en.md)

> English quick guide. The film and SVG artwork keep their original Chinese labels. The [Chinese guide](README.md) has the longer history and frame-by-frame storyboard.

## Overview

Glass that does not glow and has no color of its own — it only bends what is behind it. The amount of bending equals the slope of the edge: the middle is flat and stays readable, the rim gets steeper and bends harder.

The 20-second film follows **one glass droplet** in a single shot that passes *through* glass twice. The droplet hangs over a wall of type and drops onto it: the whole wall ripples, three satellite drops splash out and are pulled back by surface tension. The puddle becomes a magnifying lens that wanders over “Aa” while a bevel readout counts 44 → 0 → 44 and the light source circles once. The camera then pushes into the lens, and inside it is already the next world. There the lens shrinks into a 2001 Aqua button and hops along a timeline, changing material in mid-air (Aero, iOS 7, Glassmorphism) until it lands as a 2025 liquid droplet. It splits into three; two merge through a neck, and the third grows into a menu when tapped. It becomes the mini player of a phone that swings in in 3D, beside a browser; content scrolls under the glass and the labels flip between black and white. It flies out, the camera dives through it again into the five rules, read one beat at a time by a magnifier bar, and finally it lifts off back to where it started.

Everything glass can do is used: ripples across the whole frame, caustic light pools (shadow plus focused light) that separate from the glass as it rises, necks and satellite drops, specular sheen sliding over tilted devices. Every frame is computed in a WebGL shader from signed distance fields; fast frames average 2–6 sub-frames for motion blur.

Series: **Design styles**. Period shown: **2013—today**, with its ancestors back to 2001.

**The one trick:** *refraction = slope of the edge.* Wider bevel = thicker glass; steeper slope = harder bending at the rim; the center is always flat.

## Five practical rules

| Rule | How to apply it |
|---|---|
| **Bend, don't blur** | Displace only inside the bevel ring, by slope t^2.4, sampling inward; magnify the middle by 3–6%. If the middle bends, text is unreadable; if the edge doesn't bend, you are back to 2013 frosted glass. |
| **Thickness = hierarchy** | Higher layers are thicker: list rows 12px, buttons 26px, sheets and players 44px. |
| **Controls only** | Content fills the screen; glass is only for navigation, buttons and players floating above it. Never glass on glass, never body cards made of glass. |
| **Merge when close** | Two pieces closer than 24px join via smooth-min and grow a neck; a button growing into a menu is one shape morphing continuously. |
| **Adaptive text** | Pick text color from the luminance behind the glass: light behind → black, dark behind → white, ≥ 4.5:1. |

## Project palette and typography

- Glass itself: white 4–6%, a 1px rim highlight from one light source (top-left, −37°), a soft drop shadow `0 10px 32px rgb(0 0 0 / .18)`. Glass that carries text adds a little frost (6–14px) and 30–46% white.
- Content behind it: Ink `#0B0C10`, Paper `#F3F2EE`, Orange `#FF5A1F`, Pink `#FF2E7E`, Mint `#2BD9A0`, Violet `#8B5CFF`, Blue `#2E4BFF` (white text only on blue).
- Glass parameters: bevel 12 / 26 / 44px, edge 0.9, magnification 3 / 4 / 6%, chromatic aberration 6% (R / G / B scales 1.06 / 1.00 / 0.94).
- Typefaces: Inter Display (titles), Inter (UI text), Geist Mono (parameter readouts), Noto Sans SC 700+ for Chinese on glass.
- Tokens: [JSON](tokens.json), [CSS](tokens.css) (with an SVG-filter refraction path and a frosted fallback, `prefers-reduced-transparency` support), [TypeScript](tokens.ts).

## Visual references

All four sheets keep their original Chinese labels. The glass in them is real refraction: `images/glass.py` builds displacement maps from each shape's distance field and SVG `feDisplacementMap` bends the content behind, once per color channel.

### Liquid Glass at a glance

![Liquid Glass at a glance](images/preview/poster.svg)

### Five layers, one slope curve, three thicknesses, three rules

![Cheatsheet](images/preview/cheatsheet.svg)

### Liquid Glass in an app

![Music player app concept](images/preview/app-ui.svg)

### Five steps to a piece of liquid glass

![Five-step tutorial](images/preview/steps.svg)

## Common mix-ups

- **Not Glassmorphism.** Glassmorphism (2020) is blur plus a white border. Liquid Glass keeps the background sharp and bends only at the edges.
- **Not skeuomorphism.** It imitates how glass treats light, not what a glass object looks like.
- **Legibility is the real problem.** Adaptive text color, frost under text, and respecting the system's reduce-transparency setting are part of the style, not extras.

## Timing

| Time | Frames | Shot | On screen |
|---|---|---|---|
| 0–2.5 s | 0–150 | The drop | A hanging droplet rises, falls (shrinking, shadow converging), hits the type wall: splash, light-pool flash, a ripple bends LIQUID GLASS; three satellites fly and are pulled back with necks; the puddle becomes a lens and the camera follows it |
| 2.5–5 s | 150–300 | 01 Bend | The lens wanders over “Aa”; bevel 44 → 0 (flat window) → 44 with a live cross-section; chromatic aberration 0 → 6%; the light circles once; the camera dives through the lens |
| 5–9 s | 300–540 | 02 Twenty-five years | The lens shrinks into an Aqua button and hops along a timeline, morphing mid-air: Aero, iOS 7, Glassmorphism, Liquid Glass. Only liquid glass casts a caustic pool |
| 9–11.5 s | 540–690 | 03 Merge | One drop splits into three; two merge through a neck (gap 140 → 0); a tap grows the third into a menu |
| 11.5–15 s | 690–900 | 04 UI | Phone and browser swing in in 3D; the tab bar shrinks on scroll and the player drops into its row; a click ripples the page; labels flip white over dark content |
| 15–17.7 s | 900–1060 | Five rules | The player flies out toward the camera, second dive; a magnifier bar reads the five rules one beat each |
| 17.7–20 s | 1060–1200 | Back to start | The magnifier becomes a drop and lifts off; the camera tilts back up to the type wall — the first frame |

| Property | Value |
|---|---|
| Canvas | 1920 × 1080 |
| Frame rate | 60 fps |
| Duration | 20 s / 1200 frames |
| Tempo | 120 BPM throughout |
| Loop | The last frame flows into the first (the drop returns to where it hangs); the music's tail folds back into the start |

## Reproduce

```bash
npm run studio
npm run render:014   # needs WebGL: --gl=swangle is already in the script
npm run images:014
```

Open Remotion Studio and select the `S014-LiquidGlass` composition.
