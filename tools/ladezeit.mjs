// Misst, was eine Seite beim Öffnen lädt: Anfragen, Bytes je Art, die größten
// Dateien, LCP und Konsolenfehler. Gedacht zum Vergleichen vor und nach einer
// Änderung, nicht als absolute Zahl — lokal fehlen Netz und Kompression.
//
//   node tools/ladezeit.mjs [basis] [--json datei] [--mobil]
//   basis: z. B. http://127.0.0.1:5310 (pnpm dev) oder https://miwale.com
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const basis = (args.find((a) => /^https?:/.test(a)) || 'http://127.0.0.1:5310').replace(/\/$/, '');
const jsonZiel = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const mobil = args.includes('--mobil');
const SEITEN = ['/', '/games/chromatic', '/portfolio', '/projekte', '/requests', '/styles/'];

const art = (typ, url) => {
  if (/font|woff/.test(typ) || /\.woff2?($|\?)/.test(url)) return 'font';
  if (/image/.test(typ)) return 'bild';
  if (/video|audio/.test(typ)) return 'medien';
  if (/javascript/.test(typ)) return 'js';
  if (/css/.test(typ)) return 'css';
  if (/html/.test(typ)) return 'html';
  return 'sonst';
};

const browser = await chromium.launch();
const ergebnisse = {};
for (const pfad of SEITEN) {
  const kontext = await browser.newContext(mobil
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const seite = await kontext.newPage();
  const anfragen = [];
  const fehler = [];
  seite.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text().slice(0, 200)); });
  seite.on('pageerror', (e) => fehler.push('pageerror: ' + e.message.slice(0, 200)));
  seite.on('requestfailed', (r) => fehler.push('fehlgeschlagen: ' + r.url()));
  // Uebertragene Bytes (komprimiert), so wie sie über die Leitung gehen.
  seite.on('requestfinished', async (anfrage) => {
    const url = anfrage.url();
    if (url.startsWith('data:')) return;
    const antwort = await anfrage.response().catch(() => null);
    if (!antwort) return;
    const { responseBodySize } = await anfrage.sizes().catch(() => ({ responseBodySize: 0 }));
    anfragen.push({ url: url.replace(basis, ''), status: antwort.status(), art: art(antwort.headers()['content-type'] || '', url), bytes: responseBodySize });
  });
  await seite.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const start = Date.now();
  await seite.goto(basis + pfad, { waitUntil: 'load', timeout: 60000 });
  const geladen = Date.now() - start;
  await seite.waitForTimeout(2500);
  const zeiten = await seite.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), lcp: Math.round(window.__lcp) };
  });
  const jeArt = {};
  for (const a of anfragen) {
    jeArt[a.art] ??= { anzahl: 0, kb: 0 };
    jeArt[a.art].anzahl++;
    jeArt[a.art].kb += a.bytes / 1024;
  }
  for (const v of Object.values(jeArt)) v.kb = Math.round(v.kb);
  const gesamtKb = Math.round(anfragen.reduce((s, a) => s + a.bytes, 0) / 1024);
  ergebnisse[pfad] = { anfragen: anfragen.length, gesamtKb, geladenMs: geladen, ...zeiten, jeArt, fehler,
    groesste: anfragen.sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((a) => `${Math.round(a.bytes / 1024)} KB ${a.url}`),
    fremd: [...new Set(anfragen.filter((a) => !a.url.startsWith('/')).map((a) => new URL(a.url).host))] };
  await kontext.close();
}
await browser.close();

for (const [pfad, e] of Object.entries(ergebnisse)) {
  console.log(`\n${pfad}  ${e.anfragen} Anfragen, ${e.gesamtKb} KB, DCL ${e.dcl} ms, load ${e.load} ms, LCP ${e.lcp} ms`);
  console.log('  ' + Object.entries(e.jeArt).map(([k, v]) => `${k} ${v.anzahl}×/${v.kb} KB`).join(' · '));
  for (const g of e.groesste) console.log('    ' + g);
  if (e.fremd.length) console.log('  fremde Hosts: ' + e.fremd.join(', '));
  for (const f of e.fehler) console.log('  ! ' + f);
}
if (jsonZiel) writeFileSync(jsonZiel, JSON.stringify(ergebnisse, null, 2));
