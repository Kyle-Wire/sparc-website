// node render_social.cjs -> ../assets/online/<platform>/<name>.png at exact size (banners and LinkedIn profile also at 2x)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const B = path.join(__dirname, '..', 'build-social'); const O = path.join(__dirname, '..', 'assets', 'online');
const pages = JSON.parse(fs.readFileSync(path.join(B, 'manifest.json')));
(async () => { const br = await chromium.launch();
  for (const p of pages) { const [plat, name] = p.name.split('__'); fs.mkdirSync(path.join(O, plat), { recursive: true });
    const scales = (p.w < 1000 || p.h < 500) ? [1, 2] : [1];
    for (const s of scales) { const pg = await br.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: s });
      await pg.goto('file://' + path.join(B, p.name + '.html')); await pg.evaluate(() => document.fonts.ready);
      await pg.screenshot({ path: path.join(O, plat, name + (s === 2 ? '@2x' : '') + '.png') }); await pg.close(); } }
  await br.close(); })();
