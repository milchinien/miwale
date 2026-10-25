// Checks styles of the Game Style Library: schema, STYLE.md headings, and that starter.js really runs.
//   node tools/check-styles.mjs            -> all styles
//   node tools/check-styles.mjs neon clay  -> only these
// Writes starter-<id>.png into the OS temp dir (path is printed) for a visual comparison with shots/<id>.webp.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { readStyle, styleIds, validate, root } from './styles-lib.mjs';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Static server for public/ (+ /_ds) so pages behave like on miwale.com. */
export function serve(options = {}) {
  const pub = join(root, 'public');
  // options.api: a request handler for /api/stimmen/ (e.g. stimmenBauen() with a temp folder)
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (options.api && path.startsWith('/api/stimmen')) return options.api(req, res);
    const base = /^\/(_ds|assets)\//.test(path) ? root : pub;
    let file = normalize(join(base, path));
    if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, url: 'http://127.0.0.1:' + server.address().port })));
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : styleIds();
  const outDir = join(tmpdir(), 'miwale-style-checks');
  mkdirSync(outDir, { recursive: true });
  const { server, url } = await serve();
  const browser = await chromium.launch();
  let failed = 0;
  for (const id of ids) {
    const style = readStyle(id);
    const problems = validate(style);
    if (style.starter) {
      const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      try {
        await page.goto(`${url}/styles/library/_kit/starter.html?style=${id}&t=2.5`);
        await page.waitForFunction(() => window.__starter && (window.__starter.ready || window.__starter.errors.length), null, { timeout: 15000 });
        const info = await page.evaluate(() => {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          const seen = new Set();
          let transparent = 0;
          for (let i = 0; i < d.length; i += 4 * 97) {
            if (d[i + 3] < 250) transparent++;
            seen.add((d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3));
          }
          return { errors: window.__starter.errors, frameMs: window.__starter.frameMs, colors: seen.size, transparent, samples: d.length / (4 * 97) };
        });
        for (const e of [...info.errors, ...pageErrors]) problems.push('starter.js runtime: ' + e.split('\n')[0]);
        if (info.colors < 12) problems.push(`starter.js: preview looks empty (${info.colors} distinct colours)`);
        if (info.transparent > info.samples * 0.02) problems.push('starter.js: preview leaves transparent areas – fill the whole canvas');
        if (info.frameMs > 16) problems.push(`starter.js: draw() takes ${info.frameMs.toFixed(1)} ms per frame (budget ~8 ms)`);
        const png = join(outDir, `starter-${id}.png`);
        await page.screenshot({ path: png });
        console.log(`${id}: preview ${png} (${info.frameMs ? info.frameMs.toFixed(1) : '?'} ms/frame)`);
      } catch (e) {
        problems.push('starter.js: preview did not finish – ' + e.message.split('\n')[0]);
      }
      await page.close();
    }
    if (problems.length) { failed++; console.log(`✗ ${id}\n  - ` + problems.join('\n  - ')); }
    else console.log(`✓ ${id}`);
  }
  await browser.close();
  server.close();
  if (failed) { console.log(`\n${failed} style(s) with problems.`); process.exit(1); }
}
