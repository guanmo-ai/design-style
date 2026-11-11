import test from 'node:test';
import assert from 'node:assert/strict';

let preferenceChanged;
const preference = {matches:false, addEventListener:(_, listener) => {preferenceChanged = listener;}};
globalThis.window = {matchMedia:() => preference};
globalThis.getComputedStyle = () => ({transform:'none',opacity:'1'});
const {animate, closeDialog, openDialog, springFrames, springs} = await import('../../gallery/assets/motion.mjs');
const flush = () => new Promise(resolve => setImmediate(resolve));

class NativeAnimation {
  playState = 'running';
  finished = new Promise((resolve, reject) => {this.resolve = resolve;this.reject = reject;});
  cancel() {this.playState = 'idle';this.reject(new Error('cancelled'));}
  finish() {this.playState = 'finished';this.resolve();}
}
function element() {
  return {animations:[], animate() {const a = new NativeAnimation();this.animations.push(a);return a;}};
}
function dialog() {
  return {...element(), open:true, closeCount:0, classList:{add(){},remove(){}}, close() {this.open = false;this.closeCount++;}};
}

test('两种弹簧在有限帧内从起点收敛，轻微回弹不会产生越界或末帧跳变', () => {
  for (const preset of Object.values(springs)) {
    const frames = springFrames([0], [1], 'value', preset).map(frame => frame.value[0]);
    assert.equal(frames[0], 0);
    assert.equal(frames.at(-1), 1);
    assert.ok(frames.every(value => Number.isFinite(value) && value >= 0 && value < 1.05));
    assert.ok(Math.abs(frames.at(-1) - frames.at(-2)) < .005);
  }
});

test('连续交互只取消旧动画，旧 Promise 完成后仍能取消当前动画', async () => {
  const node = element();
  const first = animate(node, []);
  const second = animate(node, []);
  await first;
  assert.equal(node.animations[0].playState, 'idle');
  const third = animate(node, []);
  assert.equal(node.animations[1].playState, 'idle');
  node.animations[2].finish();
  await Promise.all([second, third]);
});

test('长按完成后的保持帧仍可取消，松手不会留下缩小的按钮', async () => {
  const node = element();
  const held = animate(node, [], {fill:'forwards'}, 'press');
  node.animations[0].finish();
  await held;
  const released = animate(node, [], {}, 'press');
  assert.equal(node.animations[0].playState, 'idle');
  node.animations[1].finish();
  await released;
});

test('重复关闭只触发一次原生关闭；退出途中重新打开不会被旧回调关闭', async () => {
  const first = dialog();
  closeDialog(first);closeDialog(first);
  assert.equal(first.animations.length, 1);
  first.animations[0].finish();
  await flush();
  assert.equal(first.closeCount, 1);
  const second = dialog();
  closeDialog(second);
  openDialog(second);
  second.animations.at(-1).finish();
  await flush();
  assert.equal(second.open, true);
  assert.equal(second.closeCount, 0);
});

test('退出过程中开启减少动态效果会完成关闭，后续操作不再创建动画', async () => {
  const node = dialog();
  closeDialog(node);
  preference.matches = true;
  preferenceChanged();
  await flush();
  assert.equal(node.closeCount, 1);
  await animate(node, []);
  assert.equal(node.animations.length, 1);
  preference.matches = false;
});
