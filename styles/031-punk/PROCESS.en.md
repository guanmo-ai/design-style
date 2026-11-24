# Punk Xerox · Production

## Originals and paper

Canvas 2D draws four grayscale originals with different highlight and shadow structures: a microphone, guitar, amplifier, and crowd. The renderer also draws paper texture, ink speckles, cut-out letters, safety pins, and tape.

Each copy generation blurs its source, then combines a brightness threshold with three layers of noise to decide where ink lands. The blur radius rises from about 0.8 to 19.3 pixels and the threshold moves from 0.50 to 0.71. Fine lines survive the first few generations and dark areas eventually merge into pools of ink.

## Camera and sound

The feeder slides a fresh original into the frame. While the camera pushes into the halftone screen, the image and dot pattern change on the beat. The camera enters a dark dot and exits through a letter stroke on a zine spread. Closing the lid, ejecting copies, tearing paper, shrinking into a grid, and whip-panning carry the later transitions.

The timeline follows the 126.56 BPM track “Dynamic Motion.” Synthesized scanner, feeder, paper, and bass sounds are layered over the music. The renderer adjusts subframe sampling to motion speed and keeps samples on their respective sides of a hard cut.

- [Video source](video/README.md)
- [Style guide](README.en.md)
- [中文](PROCESS.md)
