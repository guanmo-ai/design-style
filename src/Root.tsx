import React from 'react';
import {Composition} from 'remotion';
import {Bauhaus, BAUHAUS_DURATION} from '../styles/001-bauhaus/video/Bauhaus';
import {BentoGrid, BENTO_DURATION} from '../layouts/01-bento-grid/video/BentoGrid';
import {Masonry, MASONRY_DURATION} from '../layouts/02-masonry/video/Masonry';
import {SwissStyle, SWISS_DURATION} from '../styles/002-swiss-style/video/SwissStyle';
import {Constructivism, CONSTRUCTIVISM_DURATION} from '../styles/003-constructivism/video/Constructivism';
import {Memphis, MEMPHIS_DURATION} from '../styles/004-memphis/video/Memphis';
import {PopArt, POPART_DURATION} from '../styles/005-pop-art/video/PopArt';
import {Y2K, Y2K_DURATION} from '../styles/006-y2k/video/Y2K';
import {Risograph, RISOGRAPH_DURATION} from '../styles/008-risograph/video/Risograph';
import {Isometric, ISOMETRIC_DURATION} from '../styles/012-isometric/video/Isometric';

// 每期注册为一个 Composition：风格 S{期号}-{名字}，布局 L{期号}-{名字}
// 统一规格：1920×1080 · 60fps · 15s
export const Root: React.FC = () => (
  <>
    <Composition
      id="S001-Bauhaus"
      component={Bauhaus}
      durationInFrames={BAUHAUS_DURATION}
      fps={60}
      width={1920}
      height={1080}
    />
    <Composition
      id="S002-SwissStyle"
      component={SwissStyle}
      durationInFrames={SWISS_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 6}}
    />
    <Composition
      id="S003-Constructivism"
      component={Constructivism}
      durationInFrames={CONSTRUCTIVISM_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 5}}
    />
    <Composition
      id="S004-Memphis"
      component={Memphis}
      durationInFrames={MEMPHIS_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 5}}
    />
    <Composition
      id="S005-PopArt"
      component={PopArt}
      durationInFrames={POPART_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 5}}
    />
    <Composition
      id="L01-BentoGrid"
      component={BentoGrid}
      durationInFrames={BENTO_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true}}
    />
    <Composition
      id="L02-Masonry"
      component={Masonry}
      durationInFrames={MASONRY_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true}}
    />
    <Composition
      id="S006-Y2K"
      component={Y2K}
      durationInFrames={Y2K_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true}}
    />
    <Composition
      id="S008-Risograph"
      component={Risograph}
      durationInFrames={RISOGRAPH_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 5}}
    />
    <Composition
      id="S012-Isometric"
      component={Isometric}
      durationInFrames={ISOMETRIC_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, blur: 5}}
    />
  </>
);
