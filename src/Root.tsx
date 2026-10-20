import React from 'react';
import {Composition} from 'remotion';
import {Bauhaus, BAUHAUS_DURATION} from '../styles/001-bauhaus/video/Bauhaus';

// 每期风格注册为一个 Composition：S{期号}-{风格名}
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
  </>
);
