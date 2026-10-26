// Teilen-Karten: je Spiel ein Bild 1200x630 (assets/og/<id>.jpg) und eine
// allgemeine (assets/og/miwale.jpg). Das sieht, wer einen Link auf Discord, X,
// WhatsApp oder Slack einfuegt. Screenshot, Logo, Name, Kurztext, Tags und ein
// Spielen-Knopf. Chromium rendert eine HTML-Vorlage und speichert ein JPEG;
// JPEG, weil nicht jede Vorschau WebP kann.
//
//   node tools/og-bilder.mjs              nur fehlende
//   node tools/og-bilder.mjs --alle       alle neu
//   node tools/og-bilder.mjs dropfall …   nur diese ids (auch "miwale")
//
// Die Karten liegen im Repository; tools/sync-games.mjs erzeugt fehlende fuer
// neu aufgenommene Spiele. Ohne Karte faellt die Seite auf assets/og/miwale.jpg zurueck.
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { katalogLesen, hauptbild, text, esc, OG } from './seiten-lib.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const datei = (rel) => pathToFileURL(join(repo, rel.replace(/^\//, ''))).href;
const schrift = (familie, rel, bereich) =>
  `@font-face{font-family:"${familie}";font-weight:400 800;src:url("${datei(rel)}") format("woff2");unicode-range:${bereich}}`;
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF';

const BASIS_CSS = `
${schrift('Quicksand', 'assets/fonts/quicksand-v37-latin.woff2', LATIN)}
${schrift('Quicksand', 'assets/fonts/quicksand-v37-latin-ext.woff2', LATIN_EXT)}
${schrift('Manrope', 'assets/fonts/manrope-v20-latin.woff2', LATIN)}
${schrift('Manrope', 'assets/fonts/manrope-v20-latin-ext.woff2', LATIN_EXT)}
*{box-sizing:border-box}
html,body{margin:0;width:${OG.breite}px;height:${OG.hoehe}px;overflow:hidden;background:#070C1A}
body{position:relative;font-family:Manrope,system-ui,sans-serif;color:#EDF3F9}
.logo{position:absolute;left:64px;top:50px;height:48px;width:auto}
.knopf{position:absolute;left:64px;bottom:54px;display:inline-flex;align-items:center;gap:12px;height:58px;padding:0 28px;border-radius:10px;background:linear-gradient(180deg,#8BEAF3,#3FC6DC);color:#062A33;font-weight:800;font-size:22px;letter-spacing:.05em;text-transform:uppercase}
.knopf svg{width:20px;height:20px;fill:#062A33}
.adresse{position:absolute;right:64px;bottom:66px;font-weight:700;font-size:22px;letter-spacing:.04em;color:rgba(237,243,249,.78)}
`;

function spielKarte(sp) {
  const t = text(sp);
  const name = sp.name;
  const gross = name.length <= 13 ? 92 : name.length <= 20 ? 76 : 62;
  const kurz = (t.kurz || '').length > 150 ? t.kurz.slice(0, 147).replace(/\s+\S*$/, '') + '…' : t.kurz;
  return `<!doctype html><meta charset="utf-8"><style>${BASIS_CSS}
.bild{position:absolute;inset:0;background:url("${datei(hauptbild(sp))}") center/cover no-repeat;filter:saturate(1.05)}
.schleier{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,10,22,.97) 0%,rgba(5,10,22,.90) 38%,rgba(5,10,22,.45) 62%,rgba(5,10,22,.05) 100%),linear-gradient(0deg,rgba(5,10,22,.7) 0%,rgba(5,10,22,0) 40%)}
.inhalt{position:absolute;left:64px;top:140px;width:640px}
.tags{display:flex;gap:8px;margin:0 0 18px}
.tags span{padding:6px 14px;border-radius:6px;background:rgba(127,224,238,.16);border:1px solid rgba(127,224,238,.4);color:#7FE0EE;font-weight:700;font-size:19px}
h1{margin:0 0 18px;font:700 ${gross}px/1.02 Quicksand,Manrope,sans-serif;letter-spacing:-.015em;color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.45)}
p{margin:0;font-weight:500;font-size:27px;line-height:1.4;color:rgba(237,243,249,.88);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.flamme{position:absolute;right:56px;top:48px;padding:10px 20px;border-radius:8px;background:linear-gradient(135deg,#FFB25B,#FF6A3D);color:#2B1204;font-weight:800;font-size:22px;letter-spacing:.06em;text-transform:uppercase}
</style>
<div class="bild"></div><div class="schleier"></div>
<img class="logo" src="${datei('assets/logo-wordmark-light.png')}" alt="">
${sp.trend ? `<div class="flamme">Trending #${sp.trend}</div>` : sp.neu ? '<div class="flamme">New</div>' : ''}
<div class="inhalt">
  <div class="tags">${(t.tags || []).slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
  <h1>${esc(name)}</h1>
  <p>${esc(kurz)}</p>
</div>
<div class="knopf"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Play free in your browser</div>
<div class="adresse">miwale.com</div>`;
}

function allgemeineKarte(spiele) {
  const bilder = spiele.slice(0, 3).map((sp) => datei(hauptbild(sp)));
  return `<!doctype html><meta charset="utf-8"><style>${BASIS_CSS}
body{background:radial-gradient(900px 520px at 12% 0%,rgba(127,224,238,.22),transparent 70%),radial-gradient(700px 500px at 100% 100%,rgba(23,169,196,.22),transparent 70%),linear-gradient(180deg,#0D3A4E 0%,#071A29 60%,#050A16 100%)}
.logo{height:84px;top:60px}
.inhalt{position:absolute;left:64px;top:200px;width:500px}
h1{margin:0 0 20px;font:700 62px/1.05 Quicksand,Manrope,sans-serif;letter-spacing:-.015em;color:#fff}
p{margin:0;font-weight:500;font-size:26px;line-height:1.4;color:rgba(237,243,249,.85)}
.kachel{position:absolute;width:390px;aspect-ratio:16/9;border-radius:12px;background-size:cover;background-position:center;border:1px solid rgba(255,255,255,.25);box-shadow:0 24px 60px rgba(0,0,0,.55)}
.k1{left:660px;top:46px;transform:rotate(-5deg)}.k2{left:770px;top:196px;transform:rotate(4deg)}.k3{left:650px;top:346px;transform:rotate(-3deg)}
.adresse{display:none}
</style>
<img class="logo" src="${datei('assets/logo-wordmark-light.png')}" alt="">
${bilder.map((b, i) => `<div class="kachel k${i + 1}" style="background-image:url('${b}')"></div>`).join('')}
<div class="inhalt"><h1>Games you can play in seconds.</h1><p>Idle games, card games and roguelites — free in your browser.</p></div>
<div class="knopf"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Play free in your browser</div>
<div class="adresse">miwale.com</div>`;
}

export async function erzeugen(ids) {
  const spiele = katalogLesen(repo);
  const ziele = ids.map((id) => ({ id, karte: id === 'miwale' ? allgemeineKarte(spiele) : spielKarte(spiele.find((s) => s.id === id)) }));
  if (!ziele.length) return 0;
  const { chromium } = await import('playwright');
  const ordner = join(repo, 'assets/og');
  mkdirSync(ordner, { recursive: true });
  const temp = mkdtempSync(join(tmpdir(), 'miwale-og-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: OG.breite, height: OG.hoehe }, deviceScaleFactor: 1 });
  for (const { id, karte } of ziele) {
    const html = join(temp, id + '.html');
    writeFileSync(html, karte);
    await page.goto(pathToFileURL(html).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      await new Promise((r) => requestAnimationFrame(() => r()));
    });
    await page.waitForTimeout(150);
    writeFileSync(join(ordner, id + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 86 }));
  }
  await browser.close();
  rmSync(temp, { recursive: true, force: true });
  return ziele.length;
}

/** ids, fuer die es noch keine Karte gibt (immer die allgemeine mit). */
export function fehlend() {
  const alle = ['miwale', ...katalogLesen(repo).map((s) => s.id)];
  return alle.filter((id) => !existsSync(join(repo, 'assets/og', id + '.jpg')));
}

const isMain = process.argv[1] && /og-bilder\.mjs$/.test(process.argv[1]);
if (isMain) {
  const argumente = process.argv.slice(2);
  const alle = ['miwale', ...katalogLesen(repo).map((s) => s.id)];
  const ids = argumente.includes('--alle') ? alle : argumente.filter((a) => !a.startsWith('--')).length ? argumente.filter((a) => !a.startsWith('--')) : fehlend();
  const n = await erzeugen(ids);
  console.log(n ? `${n} Teilen-Karte(n) nach assets/og/ geschrieben: ${ids.join(', ')}` : 'Alle Teilen-Karten sind da.');
}
