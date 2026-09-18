// Prueft, ob ein gebautes Spiel einen spielbaren Kern hat. Nur was hier
// durchkommt, landet auf miwale.com (tools/sync-games.mjs).
//
// Spielbar heisst hier, in dieser Reihenfolge:
//   1. Die Seite laedt, und keine eigene Datei fehlt (kein 404 auf Skripte,
//      Bilder, Toene).
//   2. Kein unbehandelter Fehler im Spiel, weder beim Laden noch beim Spielen.
//   3. Es ist etwas zu sehen: das Bild ist nicht einfarbig.
//   4. Es gibt etwas zum Anfassen: eine Zeichenflaeche, Knoepfe oder Eingabefelder.
//   5. Das Spiel reagiert: nach Klicks, Tippen und Tasten sieht es anders aus
//      oder die Seite hat sich veraendert.
// Dasselbe laeuft am Handy (hochkant, Finger statt Maus). Besteht das Spiel dort
// auch, gilt es als am Handy spielbar.
//
// Was die Pruefung nicht sieht: ob es ein Spiel ist. Eine drehbare Kamera ueber
// einer leeren Flaeche reagiert auch. Darum nimmt sync-games.mjs neue Repositories
// nur auf, wenn sie sich selbst als Spiel markieren (Topic "miwale" oder miwale.json).
import http from 'node:http';
import { createReadStream, statSync, writeFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const TYPEN = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.ico':'image/x-icon', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.m4a':'audio/mp4', '.webm':'video/webm', '.mp4':'video/mp4', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.wasm':'application/wasm', '.txt':'text/plain' };

// Fehler, die nichts ueber das Spiel sagen: der Browser verweigert Ton ohne
// Nutzergeste, und ResizeObserver meldet harmlose Schleifen.
const HARMLOS = [/AudioContext/i, /play\(\) (request|failed)/i, /NotAllowedError/i, /ResizeObserver loop/i, /The user aborted a request/i];

// Knoepfe, mit denen Spiele meistens anfangen.
const START = /\b(play|start|spielen|los|new game|neues spiel|begin|beginnen|continue|weiter|tap|click|ok)\b/i;

// Stellt das Spiel unter /games/<id>/ bereit, wie spaeter auf miwale.com.
function bereitstellen(ordner, id) {
  const wurzel = resolve(ordner);
  const server = http.createServer((req, res) => {
    let pfad;
    try { pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.statusCode = 400; return res.end(); }
    const vorn = `/games/${id}/`;
    if (!pfad.startsWith(vorn)) { res.statusCode = 404; return res.end(); }
    let datei = resolve(wurzel, '.' + pfad.slice(vorn.length - 1));
    try { if (statSync(datei).isDirectory()) datei = resolve(datei, 'index.html'); } catch { /* unten 404 */ }
    if (datei !== wurzel && !datei.startsWith(wurzel + sep)) { res.statusCode = 403; return res.end(); }
    try { if (!statSync(datei).isFile()) throw 0; } catch { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', TYPEN[extname(datei).toLowerCase()] || 'application/octet-stream');
    createReadStream(datei).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// Bildwerte im Browser ausrechnen, damit es ohne Bildbibliothek geht.
async function bildWerte(analyse, a, b) {
  return analyse.evaluate(async ([a64, b64]) => {
    const laden = async (s) => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + s; await i.decode(); return i; };
    const pixel = (img) => {
      const c = document.createElement('canvas');
      c.width = 320; c.height = Math.max(1, Math.round(320 * img.height / img.width));
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
      return g.getImageData(0, 0, c.width, c.height).data;
    };
    const pa = pixel(await laden(a64));
    const farben = new Set(); let summe = 0, quadrat = 0, n = 0;
    for (let i = 0; i < pa.length; i += 4) {
      farben.add((pa[i] >> 4) << 8 | (pa[i + 1] >> 4) << 4 | (pa[i + 2] >> 4));
      const l = 0.299 * pa[i] + 0.587 * pa[i + 1] + 0.114 * pa[i + 2];
      summe += l; quadrat += l * l; n++;
    }
    const streuung = Math.sqrt(Math.max(0, quadrat / n - (summe / n) ** 2));
    let anders = 0;
    if (b64) {
      const pb = pixel(await laden(b64));
      for (let i = 0; i < pa.length; i += 4) {
        if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 48) anders++;
      }
    }
    return { farben: farben.size, streuung, anders: anders / n };
  }, [a.toString('base64'), b ? b.toString('base64') : null]);
}

async function durchgang(browser, analyse, url, handy) {
  const kontext = await browser.newContext(handy
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 } });
  const seite = await kontext.newPage();
  const herkunft = new URL(url).origin;
  const fehler = [], fehlend = [];
  seite.on('pageerror', (e) => { if (!HARMLOS.some((m) => m.test(e.message))) fehler.push(e.message.split('\n')[0].slice(0, 160)); });
  seite.on('response', (r) => { if (r.url().startsWith(herkunft) && r.status() >= 400) fehlend.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  seite.on('requestfailed', (r) => { if (r.url().startsWith(herkunft)) fehlend.push(`${r.failure()?.errorText || 'abgebrochen'} ${new URL(r.url()).pathname}`); });
  seite.on('popup', (p) => p.close().catch(() => {}));
  await seite.addInitScript(() => {
    window.__mwAenderungen = 0;
    const los = () => new MutationObserver((m) => { window.__mwAenderungen += m.length; })
      .observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    if (document.documentElement) los(); else document.addEventListener('DOMContentLoaded', los);
  });

  const gruende = [];
  const ergebnis = { ok: false, gruende, bilder: [] };
  try {
    const antwort = await seite.goto(url, { waitUntil: 'load', timeout: 45000 });
    if (!antwort || !antwort.ok()) { gruende.push(`Seite laedt nicht (${antwort ? antwort.status() : 'keine Antwort'})`); return ergebnis; }
    await seite.waitForTimeout(3500);

    const vorher = await seite.screenshot({ type: 'jpeg', quality: 85 });
    const start = await bildWerte(analyse, vorher);
    if (start.farben < 6 && start.streuung < 4) gruende.push('nichts zu sehen: das Bild ist einfarbig');

    // Etwas zum Anfassen? Die groesste sichtbare Zeichenflaeche zaehlt als Ziel.
    const anfassen = await seite.evaluate(() => {
      const sichtbar = (el) => { const r = el.getBoundingClientRect(); return r.width > 8 && r.height > 8 && getComputedStyle(el).visibility !== 'hidden'; };
      const flaechen = [...document.querySelectorAll('canvas')].filter(sichtbar)
        .map((c) => c.getBoundingClientRect()).sort((a, b) => b.width * b.height - a.width * a.height);
      const bedienbar = [...document.querySelectorAll('button, [role=button], input, select, textarea, [onclick], [tabindex]')].filter(sichtbar).length;
      const f = flaechen[0];
      return { flaechen: flaechen.length, bedienbar, ziel: f ? { x: f.x + f.width / 2, y: f.y + f.height / 2 } : null };
    });
    if (!anfassen.flaechen && !anfassen.bedienbar) gruende.push('nichts zum Anfassen: keine Zeichenflaeche, keine Knoepfe');

    const aenderungenVorher = await seite.evaluate(() => window.__mwAenderungen);
    const ansicht = seite.viewportSize();
    const ziel = anfassen.ziel || { x: ansicht.width / 2, y: ansicht.height / 2 };
    const tippen = async (x, y) => handy ? seite.touchscreen.tap(x, y) : seite.mouse.click(x, y);

    // Wie ein Mensch, der das Spiel zum ersten Mal sieht: auf "Start" druecken,
    // ins Bild tippen, ein paar uebliche Tasten.
    const knopf = seite.locator('button, [role=button], input[type=button], input[type=submit]').filter({ hasText: START }).first();
    try { if (await knopf.count() && await knopf.isVisible()) { await knopf.click({ timeout: 2000 }); await seite.waitForTimeout(600); } } catch { /* verdeckt oder weg */ }
    await tippen(ziel.x, ziel.y).catch(() => {});
    await seite.waitForTimeout(400);
    if (!handy) {
      await seite.mouse.move(ziel.x - 120, ziel.y - 40);
      await seite.mouse.down();
      await seite.mouse.move(ziel.x + 120, ziel.y + 40, { steps: 8 });
      await seite.mouse.up();
      for (const taste of ['Enter', 'Space', 'ArrowRight', 'ArrowUp', 'KeyD', 'KeyW', '1']) {
        await seite.keyboard.press(taste).catch(() => {});
        await seite.waitForTimeout(120);
      }
    }
    await tippen(ziel.x + 30, ziel.y + 30).catch(() => {});
    await seite.waitForTimeout(2000);

    // Das Spiel kann dabei weggeleitet haben (Link nach draussen).
    if (!seite.url().startsWith(herkunft)) gruende.push(`das Spiel verlaesst die Seite nach ${seite.url().slice(0, 80)}`);
    const nachher = await seite.screenshot({ type: 'jpeg', quality: 85 });
    const vergleich = await bildWerte(analyse, vorher, nachher);
    const aenderungen = (await seite.evaluate(() => window.__mwAenderungen).catch(() => 0)) - aenderungenVorher;
    if (vergleich.anders < 0.003 && aenderungen <= 0) gruende.push('keine Reaktion auf Klicks, Tippen oder Tasten');

    if (fehler.length) gruende.push(`Fehler im Spiel: ${[...new Set(fehler)].slice(0, 3).join(' | ')}`);
    if (fehlend.length) gruende.push(`fehlende Dateien: ${[...new Set(fehlend)].slice(0, 4).join(', ')}`);
    ergebnis.werte = { farben: start.farben, anders: vergleich.anders, aenderungen };
    ergebnis.ok = gruende.length === 0;
    ergebnis.bilder = [vorher, nachher];
    return ergebnis;
  } catch (e) {
    gruende.push(`Pruefung abgebrochen: ${String(e.message || e).split('\n')[0].slice(0, 160)}`);
    return ergebnis;
  } finally {
    await kontext.close().catch(() => {});
  }
}

// ordner: gebautes Spiel mit index.html. bilder: Pfadvorlage fuer Aufnahmen,
// z. B. "assets/games/auto/idlekin" -> idlekin-0.jpg (Start), idlekin-1.jpg (nach Eingaben).
export async function kernPruefen({ ordner, id, bilder }) {
  const server = await bereitstellen(ordner, id);
  const url = `http://127.0.0.1:${server.address().port}/games/${id}/`;
  const browser = await chromium.launch();
  try {
    const analyse = await browser.newPage();
    const pc = await durchgang(browser, analyse, url, false);
    const handy = pc.ok ? await durchgang(browser, analyse, url, true) : { ok: false, gruende: ['nicht geprueft'] };
    if (pc.ok && bilder) pc.bilder.forEach((b, i) => writeFileSync(`${bilder}-${i}.jpg`, b));
    return { ok: pc.ok, gruende: pc.gruende, handy: handy.ok, handyGruende: handy.gruende, werte: pc.werte };
  } finally {
    await browser.close();
    server.close();
  }
}

// Von Hand: node tools/kern-pruefung.mjs public/games/chromatic chromatic
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/').split('/').pop())) {
  const [ordner, id] = process.argv.slice(2);
  if (!ordner || !id) { console.error('Aufruf: node tools/kern-pruefung.mjs <ordner> <id>'); process.exit(2); }
  const e = await kernPruefen({ ordner, id });
  console.log(JSON.stringify(e, null, 2));
  process.exit(e.ok ? 0 : 1);
}
