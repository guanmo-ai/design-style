import React from 'react';
import {Composition} from 'remotion';
import {Bauhaus, BAUHAUS_DURATION} from '../styles/001-bauhaus/video/Bauhaus';
import {BentoGrid, BENTO_DURATION} from '../layouts/01-bento-grid/video/BentoGrid';
import {Masonry, MASONRY_DURATION} from '../layouts/02-masonry/video/Masonry';
import {Scrollytelling, SCROLLY_DURATION} from '../layouts/03-scrollytelling/video/Scrollytelling';
import {PhoneSpin, SPIN_FRAMES} from '../layouts/03-scrollytelling/video/PhoneSpin';
import {SwissStyle, SWISS_DURATION} from '../styles/002-swiss-style/video/SwissStyle';
import {Constructivism, CONSTRUCTIVISM_DURATION} from '../styles/003-constructivism/video/Constructivism';

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
      id="L03-Scrollytelling"
      component={Scrollytelling}
      durationInFrames={SCROLLY_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true}}
    />
    {/* 布局 03 演示网页的逐帧图片序列（不是短片） */}
    <Composition id="L03-PhoneSpin" component={PhoneSpin} durationInFrames={SPIN_FRAMES} fps={30} width={720} height={900} />
  </>
);
