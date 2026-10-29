/** 本期适配层：只注入原始 tokens；通用实现见共用库。 */
import {C, DOT, F, LINE, SHADOW} from '../tokens';
import {createPrintKit} from '../../../src/lib/motion/print';
export type {P} from '../../../src/lib/motion/print';
export const {W, H, lerp, c01, n1, circ, rect, poly, burstD, Blk, dotsD, Dots, Speed, popS, Pop, slapS, Slap, drop, Drop, beatPulse, shake, out, tw, Txt, Bang, Box, bubbleD, Bubble, Patterns, DotWipe, BurstIris, Caption} = createPrintKit({C, F, DOT, LINE, SHADOW});
