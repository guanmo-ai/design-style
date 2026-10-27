/**
 * 风格工具箱：分屏是布局，不绑定任何风格——所以两半各穿一种以前做过的风格。
 * 这里把各期的零件和令牌集中起来：Pop = 005 波普（网点、爆炸框、拟声字、对话框）；Mem = 004 孟菲斯（积木、描边管、纸屑图案）；
 * Neo = 009 新粗野（黑框 + 硬阴影的盒子、光标）；其余风格（瑞士、包豪斯、构成主义、孔版）用各自的令牌在章节里直接画。
 * 每种风格也带着自己的“动作物理”：波普是啪的一声拍上去，孟菲斯是掉下来压扁回弹，新粗野是阴影长度 = 高度，瑞士是精确的滑动。
 */
import * as Pop from '../../../styles/005-pop-art/video/ui';
import * as Mem from '../../../styles/004-memphis/video/ui';
import * as Neo from '../../../styles/009-neo-brutalism/video/ui';
export {Pop, Mem, Neo};
export {C as PC, F as PF} from '../../../styles/005-pop-art/tokens';
export {C as MC, F as MF} from '../../../styles/004-memphis/tokens';
export {C as NC, V as NV} from '../../../styles/009-neo-brutalism/tokens';
export {C as SW, FONT as SWF} from '../../../styles/002-swiss-style/tokens';
export {C as BH} from '../../../styles/001-bauhaus/tokens';
export {C as KC} from '../../../styles/003-constructivism/tokens';
export {INK as RINK, C as RC} from '../../../styles/008-risograph/tokens';

/** 瑞士字：TeX Gyre Heros（Helvetica 的开源替代） */
export const swiss = (size: number, w = 700, ls = -0.04): React.CSSProperties => ({fontFamily: "'TeX Gyre Heros', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif", fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
/** 包豪斯字：Jost（Futura 的开源替代） */
export const bauhaus = (size: number, w = 700, ls = -0.02): React.CSSProperties => ({fontFamily: "'Jost', 'Futura', 'Noto Sans SC', sans-serif", fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
/** 构成主义字：Oswald 压缩无衬线 */
export const constructivist = (size: number, w = 700, ls = 0.01): React.CSSProperties => ({fontFamily: "'Oswald', 'Noto Sans SC', sans-serif", fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
/** 孟菲斯字：Fredoka 圆头 */
export const memphisFont = (size: number, w = 700, ls = 0): React.CSSProperties => ({fontFamily: "'Fredoka', 'Noto Sans SC', sans-serif", fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
/** 新粗野字：Space Grotesk */
export const neoFont = (size: number, w = 700, ls = -0.02): React.CSSProperties => ({fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif", fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});

import React from 'react';
