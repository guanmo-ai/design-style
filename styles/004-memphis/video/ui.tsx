/** 本期适配层：只注入原始 tokens；通用实现见共用库。 */
import {C, F, LINE, SHADOW, SQUASH} from '../tokens';
import {createBlockKit} from '../../../src/lib/motion/blocks';
export type {P} from '../../../src/lib/motion/blocks';
export const {W, H, lerp, c01, n1, rad, circ, rect, tri, half, poly, squig, squigV, Blk, Tube, drop, Drop, popS, Pop, beatPulse, out, Txt, Tag, Confetti, Patterns, Sweep, Iris, Caption} = createBlockKit({C, F, LINE, SHADOW, SQUASH});
