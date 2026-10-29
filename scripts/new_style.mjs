#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {transform} from 'esbuild';
import ts from 'typescript';

const templateRoot = fileURLToPath(new URL('./templates/style/', import.meta.url));

async function newStyle(name) {
  if (!/^(?!000)\d{3}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name ?? '')) {
    throw new Error('用法：node scripts/new_style.mjs NNN-name（001—999，小写英文与连字符）');
  }
  const id = name.slice(0, 3);
  const slug = name.slice(4);
  const component = slug.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
  const composition = `S${id}-${component}`;
  const rootPath = path.resolve('src/Root.tsx');
  const packagePath = path.resolve('package.json');
  const [root, packageText, styles] = await Promise.all([
    fs.readFile(rootPath, 'utf8'), fs.readFile(packagePath, 'utf8'), fs.readdir('styles'),
  ]);
  const pkg = JSON.parse(packageText);
  const source = ts.createSourceFile('Root.tsx', root, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = source.statements.filter(ts.isVariableStatement)
    .flatMap((s) => [...s.declarationList.declarations])
    .filter((d) => ts.isIdentifier(d.name) && d.name.text === 'Root');
  let body = declarations.length === 1 && declarations[0].initializer;
  if (!body || !ts.isArrowFunction(body)) throw new Error('无法识别 Root 的 JSX 外框，未改动文件。');
  body = body.body;
  while (ts.isParenthesizedExpression(body)) body = body.expression;
  if (!ts.isJsxFragment(body)) throw new Error('Root 必须直接返回 JSX Fragment，未改动文件。');
  const ids = [];
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'id') {
      const value = node.initializer;
      const literal = value && ts.isJsxExpression(value) ? value.expression : value;
      if (!literal || !ts.isStringLiteralLike(literal)) throw new Error('Root 内有无法静态判断的 id，请手动注册；未改动文件。');
      ids.push(literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  if (styles.some((s) => s === id || s.startsWith(`${id}-`)) ||
      Object.keys(pkg.scripts ?? {}).some((s) => new RegExp(`:${id}(?::|$)`).test(s)) ||
      ids.some((value) => value === `S${id}` || value.startsWith(`S${id}-`))) {
    throw new Error(`期号 ${id} 已被目录、命令或合成占用，未改动文件。`);
  }
  const closing = body.closingFragment.getStart(source);
  const imports = source.statements.filter(ts.isImportDeclaration);
  const importEnd = imports.length ? imports.at(-1).end : 0;
  const registration = `    <Composition
      id="${composition}"
      component={${component}}
      durationInFrames={${component.toUpperCase()}_DURATION}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{music: true, step: 1, blur: 6, res: 1}}
    />
    <Composition
      id="${composition}-Preview"
      component={${component}}
      durationInFrames={${component.toUpperCase()}_DURATION / 2}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{music: true, step: 2, blur: 1, res: 0.5}}
    />
  `;
  let nextRoot = root.slice(0, closing) + registration + root.slice(closing);
  nextRoot = nextRoot.slice(0, importEnd) + `\nimport {${component}, ${component.toUpperCase()}_DURATION} from '../styles/${name}/video/${component}';\n` + nextRoot.slice(importEnd);
  pkg.scripts ??= {};
  const music = `npm run music:${id}`;
  const render = `remotion render src/index.ts ${composition}`;
  Object.assign(pkg.scripts, {
    [`music:${id}`]: `python3 styles/${name}/audio/make_music.py`,
    [`render:${id}`]: `${music} && ${render} out/${name}-master.mp4 --codec=h264 --crf=16 --color-space=bt709`,
    [`render:${id}:gpu`]: `${music} && ${render} out/${name}-master.mp4 --codec=h264 --crf=16 --color-space=bt709 --gl=angle`,
    [`preview:${id}`]: `${music} && ${render}-Preview out/${id}-preview.mp4 --scale=0.5 --codec=h264 --crf=20`,
    [`images:${id}`]: `python3 styles/${name}/images/make_svgs.py && python3 scripts/build_images.py styles/${name}/images`,
  });
  const values = {ID: id, NAME: name, COMPONENT: component, CONSTANT: `${component.toUpperCase()}_DURATION`};
  const fill = (s) => s.replace(/__([A-Z]+)__/g, (full, key) => values[key] ?? full);
  const files = new Map();
  async function collect(dir, relative = '') {
    for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
      const rel = path.join(relative, entry.name);
      if (entry.isDirectory()) await collect(path.join(dir, entry.name), rel);
      else files.set(fill(rel).replace(/\.txt$/, ''), fill(await fs.readFile(path.join(dir, entry.name), 'utf8')));
    }
  }
  await collect(templateRoot);
  await transform(nextRoot, {loader: 'tsx'});
  for (const [file, content] of files) {
    if (/\.tsx?$/.test(file)) await transform(content, {loader: file.endsWith('tsx') ? 'tsx' : 'ts'});
  }
  const target = path.resolve('styles', name);
  const staging = path.resolve('styles', `.${name}-${randomUUID()}`);
  let moved = false;
  let rootWritten = false;
  let packageWritten = false;
  try {
    for (const [file, content] of files) {
      const dest = path.join(staging, file);
      await fs.mkdir(path.dirname(dest), {recursive: true});
      await fs.writeFile(dest, content, {flag: 'wx'});
    }
    if (await fs.readFile(rootPath, 'utf8') !== root || await fs.readFile(packagePath, 'utf8') !== packageText) {
      throw new Error('生成期间 Root 或 package.json 有其他修改，请重试。');
    }
    await fs.rename(staging, target);
    moved = true;
    rootWritten = true;
    await fs.writeFile(rootPath, nextRoot);
    packageWritten = true;
    await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  } catch (error) {
    if (rootWritten) await fs.writeFile(rootPath, root);
    if (packageWritten) await fs.writeFile(packagePath, packageText);
    if (moved) await fs.rm(target, {recursive: true, force: true});
    throw error;
  } finally {
    await fs.rm(staging, {recursive: true, force: true});
  }
  console.log(`已生成 ${name}，注册 ${composition} 及草稿预览。下一步：npm run music:${id}；npm run studio。`);
}

try { await newStyle(process.argv[2]); }
catch (error) { console.error(error.message); process.exitCode = 1; }
