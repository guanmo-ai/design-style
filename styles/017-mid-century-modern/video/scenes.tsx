/**
 * 各段登记。先只有开场（0—450）；之后的章节按 timeline.ts 往后接。
 */
import {createSceneSampler, type Scene} from '../../../src/lib/motion/sampling';
import {C} from '../tokens';
import {Opening, openingSpeed} from './opening';
import {DURATION} from './timeline';

export const SCENES: Scene[] = [{from: -120, to: DURATION, C: Opening as unknown as Scene['C'], speed: openingSpeed, bg: C.paper}];
export const {sceneIndex, speedAt, bgAt} = createSceneSampler(SCENES, C.paper);
