/** 本期适配层：只注入原始 tokens；通用实现见共用库。 */
import {C, ECHO, FONT, FORCE, wdthOf as episodeWdthOf} from '../tokens';
import {ADV, CAP as metricsCAP, WDTH_SAMPLES} from './metrics';
import {createTrajectoryKit} from '../../../src/lib/motion/trajectory';
export type {Pt, ForceSpec} from '../../../src/lib/motion/trajectory';
export const {W, H, advOf, layout, echoAlpha, Echoes, echoCount, Word, Txt, wedgePts, Wedge, ForceLines, Rise, camT, mixHex, zoomLerp, CAP, wdthOf} = createTrajectoryKit({C, FONT, ECHO, FORCE, wdthOf: episodeWdthOf, ADV, CAP: metricsCAP, WDTH_SAMPLES});
