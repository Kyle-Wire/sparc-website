// node render.cjs -> ../print/*.pdf (vector, with bleed) and ../preview/*.png (300 dpi; big formats ~4000 px)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const B = path.join(__dirname, '..', 'build');
const m = JSON.parse(fs.readFileSync(path.join(B, 'manifest.json')));
const tag = m.code ? `-${m.code}` : '';
(async () => {
  const br = await chromium.launch();
  for (const p of m.pieces) {
    const pxW = Math.round(p.w * 96), pxH = Math.round(p.h * 96);
    const scale = Math.min(300 / 96, 4000 / pxH);
    const pg = await br.newPage({ viewport: { width: pxW, height: pxH }, deviceScaleFactor: scale });
    await pg.goto('file://' + path.join(B, p.name + '.html'));
    await pg.evaluate(() => document.fonts.ready);
    await pg.pdf({ path: path.join(__dirname, '..', 'print', p.name + tag + '.pdf'), width: p.w + 'in', height: p.h + 'in', printBackground: true, pageRanges: '1' });
    await pg.screenshot({ path: path.join(__dirname, '..', 'preview', p.name + tag + '.png') });
    await pg.close();
    console.log(p.name, p.w + 'x' + p.h + 'in');
  }
  await br.close();
})();
