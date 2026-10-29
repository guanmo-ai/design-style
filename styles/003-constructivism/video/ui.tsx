/** 本期适配层：只注入原始 tokens；通用实现见共用库。 */
import {BEAT, C, FONT, N, U} from '../tokens';
import {createAxisKit} from '../../../src/lib/motion/axis';
export type {P, Pt} from '../../../src/lib/motion/axis';
export const {W, H, lerp, c01, pt, add, mix, dir, on, pts, beat, wedge, bar, Poly, CAP, CJK, Txt, stamp, Scale, Credit, halftone, slashPoly, Tip, hull, cam, zoomIn, arcPath} = createAxisKit({C, FONT, BEAT, U, N});
