import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setPixelFormat('yuv420p');

// 兼容 TypeScript 7（原生版不再提供 JS API）：直接给 esbuild 传 tsconfigRaw，
// 避免 Remotion 的 esbuild-loader 调用 typescript.sys.readFile。
Config.overrideWebpackConfig((config) => {
  const patch = (rule: any): any => {
    if (!rule || typeof rule !== 'object') return rule;
    if (Array.isArray(rule.oneOf)) rule.oneOf = rule.oneOf.map(patch);
    if (Array.isArray(rule.rules)) rule.rules = rule.rules.map(patch);
    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
    rule.use = uses.length
      ? uses.map((u: any) => {
          const loader = typeof u === 'string' ? u : u.loader;
          if (loader && String(loader).includes('esbuild-loader')) {
            const options = typeof u === 'string' ? {} : u.options ?? {};
            return {loader, options: {...options, tsconfigRaw: {compilerOptions: {jsx: 'react-jsx'}}}};
          }
          return u;
        })
      : rule.use;
    return rule;
  };
  return {...config, module: {...config.module, rules: (config.module?.rules ?? []).map(patch)}};
});
