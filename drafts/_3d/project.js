// 投影上色：把一张 2D 画布当成“幻灯片”，从一台投影机的位置投到所有表面上（超级平面用）。
// 从投影机的位置看，图是完整的；换个角度看，它就碎在墙、墙角、楼梯上。
// 用法：const P = projector(canvas, camLike); patchPaint(material, [P1, P2])
import { THREE } from './lib.js';

export function projector(canvas, { pos, look, fov = 50, aspect = 16 / 9 }) {
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  cam.position.set(...pos); cam.lookAt(...look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true;
  const m = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return { cam, tex, m, pos: new THREE.Vector3(...pos) };
}

// 在 MeshStandardMaterial 上叠最多 3 层投影漆：漆是哑光的，盖住底色
export function patchPaint(mat, projs) {
  mat.onBeforeCompile = (sh) => {
    projs.forEach((p, i) => { sh.uniforms['pT' + i] = { value: p.tex }; sh.uniforms['pM' + i] = { value: p.m }; sh.uniforms['pP' + i] = { value: p.pos }; });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    let decl = 'varying vec3 vWP; varying vec3 vWN;\n';
    let body = '';
    projs.forEach((p, i) => {
      decl += `uniform sampler2D pT${i}; uniform mat4 pM${i}; uniform vec3 pP${i};\n`;
      body += `{ vec4 c = pM${i} * vec4(vWP, 1.0);
        if (c.w > 0.0) { vec2 uv = c.xy / c.w * 0.5 + 0.5;
          float facing = dot(normalize(vWN), normalize(pP${i} - vWP)); ${mat.side === THREE.DoubleSide ? 'facing = abs(facing);' : ''}
          if (facing > 0.0 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
            vec4 pc = texture2D(pT${i}, uv); diffuseColor.rgb = mix(diffuseColor.rgb, pc.rgb, pc.a); paintA = max(paintA, pc.a); } } }\n`;
    });
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + decl)
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat paintA = 0.0;\n' + body)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.78, paintA);');
  };
  mat.customProgramCacheKey = () => 'paint' + projs.length;
  return mat;
}
