import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from './lib.js';
import {Kit} from './kit.js';
import {buildStreet} from './scenes/street.js';

function streetMeshes(time = 4) {
  const scene = new THREE.Scene();
  const kit = new Kit(scene);
  buildStreet(kit);
  kit.update(time);
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse(object => { if (object.isMesh && !object.isInstancedMesh) meshes.push(object); });
  return meshes;
}

test('咖啡店屋面与基底顶面留有深度间距，避免镜头移动时争夺同一像素', () => {
  const meshes = streetMeshes();
  const roof = meshes.find(mesh => mesh.material.color.equals(new THREE.Color('#8A8580')));
  assert.ok(roof, '找到灰色屋面');
  const roofBounds = new THREE.Box3().setFromObject(roof);
  const slabs = meshes.filter(mesh => mesh.parent === roof.parent && mesh !== roof)
    .map(mesh => new THREE.Box3().setFromObject(mesh))
    .filter(box => box.min.x < roofBounds.min.x && box.max.x > roofBounds.max.x && box.min.z < roofBounds.min.z && box.max.z > roofBounds.max.z);
  assert.equal(slabs.length, 1, '找到覆盖屋面投影的基底');
  assert.ok(roofBounds.max.y - slabs[0].max.y >= 0.01, `屋面与基底高度差仅 ${roofBounds.max.y - slabs[0].max.y}`);
});

test('电线几何中没有完全重合的重复三角面', () => {
  const wire = streetMeshes().find(mesh => mesh.material.color.equals(new THREE.Color('#1E1E22')));
  assert.ok(wire, '找到电线');
  const geometry = wire.geometry.index ? wire.geometry.toNonIndexed() : wire.geometry;
  const positions = geometry.attributes.position;
  const triangles = new Set();
  let duplicates = 0;
  for (let i = 0; i < positions.count; i += 3) {
    const vertices = [0, 1, 2].map(j => [positions.getX(i + j), positions.getY(i + j), positions.getZ(i + j)].map(v => Math.round(v * 1e6)).join(','));
    const key = vertices.sort().join(';');
    if (triangles.has(key)) duplicates++;
    triangles.add(key);
  }
  assert.equal(duplicates, 0, `发现 ${duplicates} 个完全重合的重复三角面`);
});
