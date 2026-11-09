# Ink Wash: production

The user approved Ink Wash and requested its integration into main and the website. The original complete film is preserved byte-for-byte.

- Source: `drafts/ink-wash/opening/ink-full.mp4`, design commit `04f0aed`.
- SHA-256: `5ba83214af23c69ade13722b8ce1f214d8f81f623bf8fdbddf286a187940cc99`
- Bytes: 3573483
- 1920×1080, 60fps, 1125 frames, 18.75 seconds; H.264 and stereo AAC.

Canvas 2D and DOM provide the visuals. Python / NumPy synthesize a continuous 128 BPM score and sound effects. The formal source entry reuses the existing renderer, brush code, timeline and audio code.

Four sheets use frames extracted from the approved film, with editable SVG text and layout. Preview SVGs embed Noto Sans SC subsets and their OFL license. Media labels remain in Chinese. The tea app is fictional; composition percentages are artistic parameters.

The [day-24 release](https://github.com/guanmo-ai/design-style/releases/tag/day-24) includes the film, a complete project source ZIP and SHA256SUMS. Re-rendering may depend on the browser and fonts and does not replace the approved master.

[Guide](README.en.md) · [Source entry](video/README.md)
