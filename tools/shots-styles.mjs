// Renders the five preview images of a style into public/styles/shots/ – design only, no game HUD:
//   <id>.webp        scene (stage.html, all elements)
//   <id>_late.webp   dense scene (stage.html ?dense)
//   <id>_map.webp    wide view of the world (play.html map mode: ground of a 3200-unit area)
//   <id>_lu.webp     UI kit (stage.html view=ui)
//   <id>_zoom.webp   close-up of the scene, 1200x672
// Usage: node tools/shots-styles.mjs <id> [<id> …]   (or --all)
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { serve } from './check-styles.mjs';
import { stylesDir, styleIds } from './styles-lib.mjs';
import { fehlende, verkleinern } from './shots-klein.mjs';

const args = process.argv.slice(2);
const ids = args.includes('--all') ? styleIds() : args;
if (!ids.length) { console.log('usage: node tools/shots-styles.mjs <id> [<id> …] | --all'); process.exit(1); }

const stage = (id, extra) => `/styles/stage.html?style=${id}&shot${extra}`;
const SHOTS = [
  ['', (id) => stage(id, '&view=scene')],
  ['_late', (id) => stage(id, '&view=scene&dense')],
  ['_map', (id) => `/styles/play.html?style=${id}&shot&vw=1600&vh=900&t=20&map`],
  ['_lu', (id) => stage(id, '&view=ui')],
  ['_zoom', (id) => stage(id, '&view=scene'), true],
];

const { server, url } = await serve();
const browser = await chromium.launch();
let failed = 0;
for (const id of ids) {
  for (const [suffix, path, zoom] of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: zoom ? 2 : 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const target = path(id);
    await page.goto(url + target);
    if (target.includes('play.html')) {
      await page.waitForFunction(() => document.title === 'READY', null, { timeout: 120000 });
      const diag = await page.evaluate(() => JSON.parse(document.getElementById('diag').textContent));
      if (diag.style !== id) errors.push(`play.html rendered "${diag.style}" – add js/styles/${id}.js to play.html`);
      errors.push(...diag.errors);
    } else {
      // let the scene run until the visible ground is built and the cast has arrived
      await page.waitForFunction(() => window.__stage && window.__stage.settled, null, { timeout: 120000, polling: 250 });
      await page.waitForTimeout(1500);
      errors.push(...(await page.evaluate(() => window.__stage.errors)));
    }
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const png = await page.screenshot(zoom ? { clip: { x: 500, y: 282, width: 600, height: 336 } } : {});
    // Chromium encodes WebP itself – no image library needed
    const webp = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, png.toString('base64'));
    const out = join(stylesDir, 'shots', id + suffix + '.webp');
    writeFileSync(out, Buffer.from(webp, 'base64'));
    if (errors.length) { failed++; console.log(`✗ ${id}${suffix}: ${errors.join(' | ').slice(0, 400)}`); }
    else console.log(`✓ ${id}${suffix}`);
    await page.close();
  }
}
await browser.close();
server.close();
// Kleine Fassungen fuer Galerie und Mixer (shots/klein/), nur fuer die neuen Bilder.
await verkleinern(fehlende());
if (failed) process.exit(1);
