# 017 · Mid-Century Modern — Process

[中文](PROCESS.md) · **English**

The most-revised issue so far: two rounds of style images, three openings and five soundtracks.

- **Idea:** scissors, not rulers. Signature physics: shadow = height.
- **Images:** v1 used muted orange, mustard, and teal with faceted edges. v2 used a brighter palette drawn from Girard, Mary Blair, and Eames, with smooth hand-cut edges and a fine paper grain.
- **Video:** The first two openings tried black and red backgrounds at 7.5 and 5.5 seconds. After studying 003 and 004 frame by frame, v3 rebuilt the film: the poster assembles in 1.5 s, each chapter gets a new sheet of colored paper, and the same paper pieces relay through every chapter, flipping over as they go. v4 added impact (camera punches, paper-scrap bursts), sheets from four directions, every chapter change on a downbeat, and fixed a bug where the next background appeared before the sheet slid in.
- **Smoothness:** every pose is a pure function of time with continuous velocity; the camera follows a monotone cubic spline; paper is cut once in `make_geometry.py`; adaptive motion blur up to 6 sub-frames.
- **Music:** Early drafts tried cool jazz, bebop, and 1950s title jazz. The final version uses a bright major-key groove.
- **QA:** keyframe stills, motion curves scanned for discontinuities, seamless loop checked (frame 899 vs 0).
