# Art Nouveau: production

The approved 21-second master is reused byte-for-byte for the gallery. This English production overview summarizes the detailed Chinese production record; it does not translate the media labels.

## Master

- Original: `drafts/art-nouveau/film/art-nouveau-film.mp4`
- SHA-256: `eaa3209d1a7621a1e13aa45fa835052e70327ad20463cfe71f30cab005896d04`
- 24565469 bytes; 1920×1080; 60fps; 1260 frames; H.264 and stereo AAC, 48 kHz.

## Renderer and timing

The renderer lives under `drafts/art-nouveau/film/` and uses Canvas 2D, with no WebGL. A path builder integrates curvature along arc length to produce one master line for the whole film. Each frame is a function of its frame number: growth follows a monotone cubic through keyframes, so position and speed stay continuous; the camera follows keyframes or looks 22 frames ahead along the line, then is smoothed with a Gaussian kernel. Four sub-frames per frame provide motion blur. The frame-difference check reports no jumps, no dead zones and a maximum single-frame change of 10.9.

The signature motion is the growing tip: the last 240 px of the line are re-integrated with extra curvature whose amount follows the growth speed through an underdamped spring, so the tip curls tighter while accelerating and overshoots before relaxing when it stops. The score is a 3/4 waltz synthesized in Python; lamp-on and the closing curl land on bar lines.

## Gallery materials

Four sheets use frames extracted from the approved master, with editable SVG text and layout. Font subsets and the Noto Sans SC OFL license are embedded in preview SVGs. The interface is a fictional design study. The master, its audio and the original render code are unchanged.

[Guide](README.en.md) · [Detailed production record in Chinese](PROCESS.md) · [Source entry](video/README.md)
