# 017 · Mid-Century Modern — Process

[中文](PROCESS.md) · **English**

The most-revised issue so far: two rounds of style images, three openings and five soundtracks.

- **Idea:** scissors, not rulers. Signature physics: shadow = height.
- **Images:** v1 used muted orange / mustard / teal and faceted edges — "so-so; I prefer Memphis colors". v2 switched to the bright branch of the era (Girard, Mary Blair, Eames' colored balls), smooth hand-cut edges, clean paper grain — "much better".
- **Video:** opening v1 (black field, 7.5 s) was "slow and too dark"; v2 (red field, 5.5 s) "the red is ugly, not top-notch, faster — look at the issues I recommended". After studying 003 and 004 frame by frame, v3 rebuilt the film: the poster assembles in 1.5 s, each chapter gets a new sheet of colored paper, and the same paper pieces relay through every chapter, flipping over as they go. v4 added impact (camera punches, paper-scrap bursts), sheets from four directions, every chapter change on a downbeat, and fixed a bug where the next background appeared before the sheet slid in.
- **Smoothness:** every pose is a pure function of time with continuous velocity; the camera follows a monotone cubic spline; paper is cut once in `make_geometry.py`; adaptive motion blur up to 6 sub-frames.
- **Music:** cool jazz and bebop were "too noisy", a noise-free version "too plain", 1950s title jazz "too hurried". Offering two contrasting options at once worked: the owner picked the bright major-key groove (in the spirit of 015 v2).
- **QA:** keyframe stills, motion curves scanned for discontinuities, seamless loop checked (frame 899 vs 0).
