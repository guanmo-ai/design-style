# Plush: production

The approved 20-second master is reused byte-for-byte for the gallery. This English production overview summarizes the detailed Chinese production record; it does not translate the media labels.

## Master

- Original: `drafts/plush/film/plush-film.mp4`
- SHA-256: `f9b765cfad1b5e8c402925ed63ea4e81e21d9a79f7e2f1568304bad461c5f0a3`
- 22,862,729 bytes; 1920×1080; 60fps; 1200 frames; H.264 and stereo AAC, 48 kHz.

## Renderer and timing

The canonical renderer remains under `drafts/plush/film/`, with shared motion and stage components under `drafts/_lib/kit/` and the fur renderer under `drafts/_lib/fur/`. Each frame is a function of its frame number. A shared timeline supplies the scene changes and the 120 BPM score.

Strand tips follow a weighted history of body poses, using damped springs. Form transitions reuse the same strand population rather than cutting to unrelated objects. The production record describes fixes for whole-frame brightness jumps at the interface transitions.

## Gallery materials

Four sheets use frames extracted from the approved master, with editable SVG text and layout. Font subsets and the Noto Sans SC OFL license are embedded in preview SVGs. The interface is a fictional design study. The master, its audio and the original render code are unchanged.

[Guide](README.en.md) · [Detailed production record in Chinese](PROCESS.md) · [Source entry](video/README.md)
