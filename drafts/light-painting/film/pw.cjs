// 预加载：仓库 node_modules 里的 Playwright 版本和云端预装的浏览器对不上时，改用预装的 Chromium。
// 用法：node -r ./pw.cjs ../../_lib/film-gl.cjs …（本机浏览器齐全时它什么也不做）
const fs = require('fs'), path = require('path');
const pw = require(require.resolve('playwright', { paths: [path.join(__dirname, '../../_lib')] }));
const exe = '/opt/pw-browsers/chromium', orig = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (o = {}) => { try { return await orig(o); } catch (e) { if (!fs.existsSync(exe)) throw e; return orig({ ...o, executablePath: exe, args: [...(o.args || []), '--headless=new'] }); } };
