import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';

const out = path.resolve('out/reuse-test-modules');
await fs.mkdir(out, {recursive: true});
async function load(name) {
  const entry = path.resolve(`src/lib/motion/${name}`);
  const dest = path.join(out, name.replace(/\.tsx?$/, '.mjs'));
  await build({entryPoints: [entry], outfile: dest, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'remotion', '@remotion/*'], logLevel: 'error'});
  return import(dest);
}
const math = await load('kinematics.ts');
const sampling = await load('sampling.ts');
const flow = await load('layout-flow.ts');

test('轨迹分段保持位置和速度连续，残影可乱序取过去时刻', () => {
  const keys = [[0, 0, 0], [10, 100], [20, 160, 0]];
  const p = (t) => math.path1(t, keys);
  assert.equal(p(0), 0);
  assert.equal(p(20), 160);
  assert.ok(Math.abs((p(10) - p(9.999)) / 0.001 - (p(10.001) - p(10)) / 0.001) < 0.01);
  assert.equal(math.kin(15, 0, 10, [[0, 0], [10, -1]]), 137.5);
  const samples = [18, 3, 12, 0].map(p);
  assert.deepEqual([18, 3, 12, 0].map(p), samples);
  assert.equal(math.land(-1, 0), 0);
  assert.equal(math.land(100, 0), 1);
  assert.ok(Math.max(...Array.from({length: 40}, (_, t) => math.land(t, 0))) < 1.06);
});

test('运动模糊按最快三段取样，边界不跨段，草稿只取当前帧', () => {
  const C = () => null;
  const scenes = [{from: 0, to: 11, C, speed: () => 12, bg: '#112233'}, {from: 10, to: 20, C, speed: () => 60, dark: true}];
  const s = sampling.createSceneSampler(scenes, '#ffffff');
  assert.equal(s.speedAt(10), 60);
  assert.equal(s.bgAt(9), '#112233');
  assert.equal(s.bgAt(10), '#ffffff');
  assert.equal(s.darkAt(10), true);
  assert.deepEqual(sampling.motionBlurTimes(10, 6, s.speedAt, s.sceneIndex), [10, 10, 10, 10, 10, 10]);
  assert.deepEqual(sampling.motionBlurTimes(12, 1, s.speedAt, s.sceneIndex), [12]);
  assert.equal(sampling.motionBlurTimes(12, 6, s.speedAt, s.sceneIndex).length, 6);
});

test('运动模糊首帧不能采到第一段之前，空档有安全回退', () => {
  const sampler = sampling.createSceneSampler([{from: 0, to: 100, C: () => null, speed: () => 60}], '#ffffff');
  assert.deepEqual(sampling.motionBlurTimes(0, 6, sampler.speedAt, sampler.sceneIndex), [0, 0, 0, 0, 0, 0]);
  assert.equal(sampler.sceneIndex(-1), -1);
  assert.equal(sampler.bgAt(-1), '#ffffff');
  assert.equal(sampler.probeAt(-1), null);
  assert.equal(sampler.darkAt(-1), false);
});

test('瀑布流始终放最短列，重排被打断从当时位置继续', () => {
  const m = flow.masonry([{ratio: 2}, {ratio: 1}, {ratio: 1}], {x0: 0, y0: 0, cols: 2, colW: 100, gap: 10, r: 4});
  assert.deepEqual(m.col, [0, 1, 1]);
  assert.deepEqual(m.heights, [210, 220]);
  const rect = (x) => ({x, y: 0, w: 100, h: 100, r: 0});
  const clip = rect(0);
  const sampler = flow.createLayoutFlow({
    layouts: {EMPTY: {rects: [null], clip}, A: {rects: [rect(100)], clip}, B: {rects: [rect(300)], clip}},
    transitions: [{at: 0, to: 'A', dur: 20, stagger: 0, order: 'index', ease: 'flow'}, {at: 10, to: 'B', dur: 20, stagger: 0, order: 'index', ease: 'flow'}],
    itemCount: 1, themeOf: () => 'theme', drift: () => 0, bounds: clip, emptyName: 'EMPTY', emptyTheme: 'theme',
  });
  const left = sampler.tileState(9.99999, 0).rect;
  const right = sampler.tileState(10, 0).rect;
  assert.ok(Math.abs(left.y - right.y) < 0.001);
  assert.ok(Math.abs(left.x - right.x) < 0.001);
  assert.equal(sampler.tileState(40, 0).rect.x, 300);
});

test('残影静止时完全收拢，字体与力线用调用方参数', async () => {
  const {createTrajectoryKit} = await load('trajectory.tsx');
  const row = {O: [0.5, 0.7], A: [0.5, 0.7]};
  const kit = createTrajectoryKit({C: {ink: '#123456'}, FONT: {display: 'Example Font', sc: 'SC', mono: 'Mono'}, ECHO: {n: 3, dt: 2, alpha: 0.4}, FORCE: {max: 2, lenPerSpeed: 5, minSpeed: 1}, wdthOf: (v) => v, ADV: {700: row, 800: row, 900: row}, CAP: 0.7, WDTH_SAMPLES: [50, 100]});
  assert.equal(kit.layout('AA', 100, 50).width, 100);
  assert.equal(kit.echoCount(10, () => [0, 0]), 0);
  const markup = renderToStaticMarkup(React.createElement(kit.Echoes, {t: 10, state: () => [0], render: (tau, k) => React.createElement('text', null, `${tau}:${k}`)}));
  assert.equal((markup.match(/<text/g) ?? []).length, 1);
  const text = renderToStaticMarkup(React.createElement(kit.Word, {text: 'A', x: 0, y: 0, size: 100}));
  assert.match(text, /Example Font/);
  assert.match(text, /#123456/);
});

test('逐字排版可使用调用方生成的 400 字重度量表', async () => {
  const {createTrajectoryKit} = await load('trajectory.tsx');
  const kit = createTrajectoryKit({C: {ink: '#123456'}, FONT: {display: 'Custom', sc: 'SC', mono: 'Mono'}, ECHO: {n: 3, dt: 2, alpha: 0.4}, FORCE: {max: 2, lenPerSpeed: 5, minSpeed: 1}, wdthOf: (v) => v, ADV: {400: {O: [0.5, 0.7], A: [0.5, 0.7]}}, CAP: 0.7, WDTH_SAMPLES: [50, 100]});
  assert.equal(kit.layout('A', 100, 100, 400).width, 70);
});
