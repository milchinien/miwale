// Rechnet die Vorschaubilder der Style Library klein: public/styles/shots/<name>.webp
// -> public/styles/shots/klein/<name>.webp, 800 px breit. Galerie, Mixer und
// Collagen zeigen sie als Kacheln von 200-400 px; die grossen Shots (1600 px,
// bis 600 KB) laden nur noch die Detailseiten. Ohne Bildbibliothek: Chromium
// skaliert und kodiert WebP selbst, wie in tools/shots-styles.mjs.
//
//   node tools/shots-klein.mjs            nur fehlende oder veraltete
//   node tools/shots-klein.mjs --alle     alle neu
//   node tools/shots-klein.mjs --check    nur pruefen (fuer die Tests), Exit 1 bei Luecken
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stylesDir } from './styles-lib.mjs';

export const BREITE = 800;
const QUALITAET = 0.8;
const quelle = join(stylesDir, 'shots');
const ziel = join(quelle, 'klein');

/** Shots ohne aktuelle kleine Fassung. */
export function fehlende({ alle = false } = {}) {
  return readdirSync(quelle).filter((n) => n.endsWith('.webp')).filter((n) => {
    const klein = join(ziel, n);
    return alle || !existsSync(klein) || statSync(klein).mtimeMs < statSync(join(quelle, n)).mtimeMs;
  });
}

/** Ohne mtime: ob es zu jedem Shot eine kleine Fassung gibt (Git setzt die Zeiten beim Auschecken neu). */
export function ohneKlein() {
  return readdirSync(quelle).filter((n) => n.endsWith('.webp') && !existsSync(join(ziel, n)));
}

export async function verkleinern(namen) {
  if (!namen.length) return 0;
  const { chromium } = await import('playwright');
  mkdirSync(ziel, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const n of namen) {
    const b64 = await page.evaluate(async ([daten, breite, q]) => {
      const img = new Image();
      img.src = 'data:image/webp;base64,' + daten;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = Math.min(breite, img.naturalWidth);
      c.height = Math.round(img.naturalHeight * c.width / img.naturalWidth);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, [readFileSync(join(quelle, n)).toString('base64'), BREITE, QUALITAET]);
    writeFileSync(join(ziel, n), Buffer.from(b64, 'base64'));
  }
  await browser.close();
  return namen.length;
}

const isMain = process.argv[1] && /shots-klein\.mjs$/.test(process.argv[1]);
if (isMain) {
  if (process.argv.includes('--check')) {
    const luecken = ohneKlein();
    if (luecken.length) { console.log('Ohne kleine Fassung: ' + luecken.join(', ') + ' -- node tools/shots-klein.mjs'); process.exit(1); }
    console.log('Alle Shots haben eine kleine Fassung.');
  } else {
    const n = await verkleinern(fehlende({ alle: process.argv.includes('--alle') }));
    console.log(n ? `${n} kleine Fassung(en) nach public/styles/shots/klein/ geschrieben.` : 'Alles aktuell.');
  }
}
