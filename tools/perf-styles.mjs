// Measures the cost of styles the same way for every style, so changes can be compared before/after:
//   node tools/perf-styles.mjs <id> [<id> …] [--runs 3]
// Per style: play.html perf mode (median/p95 frame of the full game frame incl. ~45 s of actors, ground chunk
// build time) and the dense stage scene (frame time measured in the page over 2 s).
// Prints one line per style; the median of the runs counts. Compare against a baseline measured in the same
// session – absolute numbers depend on machine load.
import { chromium } from 'playwright';
import { serve } from './check-styles.mjs';

const args = process.argv.slice(2);
const ri = args.indexOf('--runs');
const runs = ri >= 0 ? Math.max(1, +args[ri + 1] || 3) : 3;
const ids = args.filter((a, i) => !a.startsWith('--') && (ri < 0 || i !== ri + 1));
if (!ids.length) { console.log('usage: node tools/perf-styles.mjs <id> [<id> …] [--runs 3]'); process.exit(1); }
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const { server, url } = await serve();
const browser = await chromium.launch();
for (const id of ids) {
  const play = [], stage = [];
  for (let r = 0; r < runs; r++) {
    const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(`${url}/styles/play.html?style=${id}&perf&vw=1600&vh=900`);
    await p.waitForSelector('#perf', { state: 'attached', timeout: 180000 });
    play.push(await p.evaluate(() => JSON.parse(document.getElementById('perf').textContent)));
    await p.close();
    const q = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await q.goto(`${url}/styles/stage.html?style=${id}&view=scene&dense&embed=1&shot`);
    await q.waitForFunction(() => window.__stage && window.__stage.settled, null, { timeout: 120000, polling: 250 });
    stage.push(await q.evaluate(() => new Promise((done) => {
      // time spent inside the renderer per frame (the style's drawing), sampled for 2 s
      const r = window.__stage.renderer, orig = r.render.bind(r), t = [];
      r.render = function () { const a = performance.now(); orig(...arguments); t.push(performance.now() - a); };
      setTimeout(() => { r.render = orig; t.sort((x, y) => x - y); done(t.length ? t[Math.floor(t.length / 2)] : -1); }, 2000);
    })));
    await q.close();
  }
  const f = (k) => median(play.map((d) => d[k]));
  console.log(`${id.padEnd(12)} play: frame median ${f('frameMsMedian').toFixed(2)} ms, p95 ${f('frameMsP95').toFixed(1)} ms, chunk ${f('chunkBuildMsAvg').toFixed(1)} ms` +
    ` | dense stage render ${median(stage).toFixed(2)} ms` + (play.some((d) => d.errors && d.errors.length) ? '  ERRORS: ' + play.flatMap((d) => d.errors).join(' | ').slice(0, 200) : ''));
}
await browser.close();
server.close();
