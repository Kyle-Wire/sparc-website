// node render_svgs.cjs <dir> <px>  -> a PNG beside each SVG, <px> wide, transparent background
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const dir = process.argv[2], px = +process.argv[3] || 2000;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: px, height: px } });
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    await p.setContent(`<html><body style="margin:0;background:transparent"><img id=i src="data:image/svg+xml;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}" style="width:${px}px;display:block"></body></html>`);
    const el = await p.$('#i'); await el.screenshot({ path: path.join(dir, f.replace('.svg', '.png')), omitBackground: true }); }
  await b.close(); })();
