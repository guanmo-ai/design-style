import React from 'react';
import {Composition} from 'remotion';
import {Bauhaus, BAUHAUS_DURATION} from '../styles/001-bauhaus/video/Bauhaus';
import {BentoGrid, BENTO_DURATION} from '../layouts/01-bento-grid/video/BentoGrid';
import {SwissStyle, SWISS_DURATION} from '../styles/002-swiss-style/video/SwissStyle';

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
      id="L01-BentoGrid"
      component={BentoGrid}
      durationInFrames={BENTO_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true}}
    />
  </>
);
