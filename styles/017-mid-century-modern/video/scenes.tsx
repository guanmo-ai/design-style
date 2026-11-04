/**
 * 各段登记。先做开场 + 01（0—210）；之后的章节按 timeline.ts 往后接。
 */
import {createSceneSampler, type Scene} from '../../../src/lib/motion/sampling';
import {C} from '../tokens';
import {Film, filmSpeed} from './film';
import {DURATION} from './timeline';

export const SCENES: Scene[] = [{from: -120, to: DURATION, C: Film as unknown as Scene['C'], speed: filmSpeed, bg: C.paper}];
export const {sceneIndex, speedAt, bgAt} = createSceneSampler(SCENES, C.paper);
