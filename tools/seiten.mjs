// Schreibt die erzeugten Seiten (siehe seiten-lib.mjs) in einen Ausgabeordner:
//   seiten/start.html           Startseite mit Titel, Vorschau, JSON-LD und Spieleliste im HTML
//   seiten/spiel/<id>.html      je Spiel: Titel, Beschreibung, Vorschaubild, Inhalt
//   press/index.html            Presse-Seite
//   press/miwale-presskit.zip   Presskit zum Herunterladen
//   robots.txt, sitemap.xml, feed.xml
//
//   node tools/seiten.mjs                      Repository: Wurzel und Ziel ist public/ der Seite
//   node tools/seiten.mjs --wurzel W --ziel Z  W: Ordner mit index.html, shop/, assets/ (dist, Image)
//
// Nichts davon steht im Repository (.gitignore): es entsteht beim Bauen aus dem
// Katalog, damit es nie veraltet. Der Vite-Server baut es bei jeder Anfrage selbst.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { katalogLesen, startSeite, spielSeite, presseSeite, presseZip, sitemap, robots, feed } from './seiten-lib.mjs';

export function schreiben({ wurzel, ziel }) {
  const spiele = katalogLesen(wurzel);
  if (!spiele.length) throw new Error('Katalog leer: ' + wurzel);
  const schreibe = (rel, inhalt) => {
    const pfad = join(ziel, rel);
    mkdirSync(dirname(pfad), { recursive: true });
    writeFileSync(pfad, inhalt);
  };
  // Alte Spielseiten weg, damit entfernte Spiele nicht als Leichen liegenbleiben.
  rmSync(join(ziel, 'seiten'), { recursive: true, force: true });
  schreibe('seiten/start.html', startSeite(wurzel, spiele));
  for (const sp of spiele) schreibe(`seiten/spiel/${sp.id}.html`, spielSeite(wurzel, sp.id, spiele));
  const zip = presseZip(wurzel, spiele);
  schreibe('press/miwale-presskit.zip', zip);
  schreibe('press/index.html', presseSeite(wurzel, spiele, Math.max(1, Math.round(zip.length / 1048576))));
  schreibe('robots.txt', robots());
  schreibe('sitemap.xml', sitemap(wurzel, spiele));
  schreibe('feed.xml', feed(wurzel, spiele));
  return { spiele: spiele.length, zipMB: +(zip.length / 1048576).toFixed(1) };
}

const isMain = process.argv[1] && /seiten\.mjs$/.test(process.argv[1]);
if (isMain) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? resolve(process.argv[i + 1]) : null; };
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const wurzel = arg('--wurzel') || repo;
  const ziel = arg('--ziel') || join(repo, 'public');
  const r = schreiben({ wurzel, ziel });
  console.log(`Seiten erzeugt: ${r.spiele} Spielseiten, Startseite, Presskit (${r.zipMB} MB), robots.txt, sitemap.xml, feed.xml -> ${ziel}`);
}
