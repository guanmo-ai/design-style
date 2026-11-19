# Dada · Making of

This overview accompanies the [detailed production notes in Chinese](https://github.com/guanmo-ai/design-style/blob/main/drafts/dada/PROCESS.md). The second cut runs 1,072 frames at 60 fps and 1920×1080. About sixty pieces of paper travel from chapter to chapter. Heavy landings jolt neighboring scraps. Each chapter change tears away its backing sheet to reveal the next color.

![Storyboard frames from the second cut](images/preview/storyboard.svg)

## The second cut

The first cut ran twenty seconds. The second cut introduces the moving backdrops, tighter timing, and a new instrumental soundtrack. “Cut and Paste” was generated in Designkit and measured at about 128.63 BPM. The mix adds synthesized paper, scissors, and typewriter sounds. The credit lands on frame 1,012, timed to the final musical hit.

## Rendering

The renderer draws five subframes per frame in Node using `@napi-rs/canvas` and encodes with FFmpeg. The gallery uses the approved second cut. The diagrams pair production frames and an existing interface study with editable text and layout in SVG.

[Detailed storyboard in Chinese](https://github.com/guanmo-ai/design-style/blob/main/drafts/dada/film/STORYBOARD.md) · [Render instructions](video/README.md) · [Design guide](README.en.md)
