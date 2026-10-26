// Captures an animation as a contact sheet, so motion can be judged from a still image:
//   node tools/filmstrip-styles.mjs <id> [view] [frames] [ms] [crop]
//     view   stage view: scene | characters | props | effects | atmosphere | world | ui   (default characters)
//     frames number of frames (default 12), ms = time between frames (default 83 ≈ 12 fps)
//     crop   x,y,w,h in CSS px of the 1000x600 stage to zoom into, e.g. 300,120,400,240 (default: whole frame)
// Also accepts a mix instead of an id: "world=a&chars=b&…".
// Writes <tmp>/miwale-filmstrips/<id>-<view>.png (4 frames per row, frame number in the corner) and prints the path.
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from './check-styles.mjs';

const [target, view = 'characters', framesArg = '12', msArg = '83', cropArg] = process.argv.slice(2);
if (!target) { console.log('usage: node tools/filmstrip-styles.mjs <id|mix-query> [view] [frames] [ms] [x,y,w,h]'); process.exit(1); }
const frames = Math.max(2, +framesArg || 12), ms = Math.max(16, +msArg || 83);
const crop = cropArg ? (([x, y, width, height]) => ({ x, y, width, height }))(cropArg.split(',').map(Number)) : null;
const query = target.includes('=') ? target : 'style=' + target;
const name = (target.includes('=') ? 'mix' : target) + '-' + view;

const { server, url } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: crop ? 2 : 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${url}/styles/stage.html?${query}&view=${view}&embed=1&shot`);
await page.waitForFunction(() => window.__stage && window.__stage.settled, null, { timeout: 120000, polling: 250 });
const shots = [];
for (let i = 0; i < frames; i++) {
  shots.push((await page.screenshot(crop ? { clip: crop } : {})).toString('base64'));
  await page.waitForTimeout(ms);
}
errors.push(...(await page.evaluate(() => window.__stage.errors)));
// compose the sheet in the browser (no image library needed)
const sheet = await page.evaluate(async ({ shots, ms }) => {
  const imgs = await Promise.all(shots.map((b) => { const i = new Image(); i.src = 'data:image/png;base64,' + b; return i.decode().then(() => i); }));
  const cols = 4, w = imgs[0].naturalWidth, h = imgs[0].naturalHeight, k = Math.min(1, 1600 / (cols * w));
  const cw = Math.round(w * k), ch = Math.round(h * k), rows = Math.ceil(imgs.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * cw + (cols - 1) * 4; c.height = rows * ch + (rows - 1) * 4;
  const x = c.getContext('2d');
  x.fillStyle = '#ff00ff'; x.fillRect(0, 0, c.width, c.height);
  imgs.forEach((im, i) => {
    const px = (i % cols) * (cw + 4), py = Math.floor(i / cols) * (ch + 4);
    x.drawImage(im, px, py, cw, ch);
    x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(px, py, 74, 20);
    x.fillStyle = '#fff'; x.font = 'bold 12px monospace'; x.fillText('#' + (i + 1) + ' ' + i * ms + 'ms', px + 4, py + 14);
  });
  return c.toDataURL('image/png').split(',')[1];
}, { shots, ms });
const dir = join(tmpdir(), 'miwale-filmstrips');
mkdirSync(dir, { recursive: true });
const out = join(dir, name + '.png');
writeFileSync(out, Buffer.from(sheet, 'base64'));
console.log(out + (errors.length ? '\nerrors: ' + errors.join(' | ').slice(0, 500) : ''));
await browser.close();
server.close();
