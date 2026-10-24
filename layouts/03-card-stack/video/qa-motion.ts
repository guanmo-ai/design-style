/** 任意 18 帧窗口里，镜头或主体必须在动。同布局 TRANS 禁止。 */
import {CARDS, DURATION, EXTRAS, TRANS, camAt, cardState, extraState} from './layout';

const WIN = 18;
const EPS = 0.35;

const camDelta = (f: number) => {
  const a = camAt(f);
  const b = camAt(f + 1);
  return Math.abs(a.s - b.s) * 900 + Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.ox - b.ox, a.oy - b.oy) * 0.2;
};

const cardDelta = (f: number) => {
  let d = 0;
  for (let i = 0; i < CARDS; i++) {
    const a = cardState(f, i).pose;
    const b = cardState(f + 1, i).pose;
    d += Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.z - b.z) + Math.abs(a.rot - b.rot) * 3 + Math.abs(a.sc - b.sc) * 80;
  }
  for (let g = 0; g < EXTRAS; g++) {
    const a = extraState(f, g);
    const b = extraState(f + 1, g);
    if (a && b) d += Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.rot - b.rot);
  }
  return d;
};

const same = TRANS.filter((t, i) => i > 0 && t.to === TRANS[i - 1].to);
if (same.length) {
  console.error('same-layout TRANS (lerp no-op):', same.map((t) => `${t.at}:${t.to}`).join(', '));
  process.exit(1);
}

const dead: number[] = [];
for (let f = 0; f < DURATION - WIN; f++) {
  let peak = 0;
  for (let k = 0; k < WIN; k++) peak = Math.max(peak, camDelta(f + k) + cardDelta(f + k));
  if (peak < EPS) dead.push(f);
}

if (dead.length) {
  const runs: string[] = [];
  let a = dead[0];
  let b = dead[0];
  for (const f of dead.slice(1)) {
    if (f === b + 1) b = f;
    else {
      runs.push(`${a}-${b + WIN}`);
      a = b = f;
    }
  }
  runs.push(`${a}-${b + WIN}`);
  console.error(`dead windows (${dead.length} starts):`, runs.join(', '));
  process.exit(1);
}

console.log(`ok · ${DURATION}f · ${TRANS.length} trans · ${CARDS} cards · no 0.3s dead zone`);
