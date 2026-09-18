// Prueft die eingefrorenen Spiele in public/games gegen manifest.json und
// gegen die Kataloge der Spieleseite. Laeuft in CI und vor jedem Build.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(site, 'public/games');
const manifest = JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const files = dir => readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]);
for (const id of Object.keys(manifest)) {
  const dir = join(root,id);
  if (!existsSync(join(dir,'index.html'))) throw new Error(`Game bundle missing: ${id}; run npm run games:sync`);
  const hash = createHash('sha256');
  for (const file of files(dir).sort()) hash.update(relative(dir,file).replaceAll('\\','/')).update(readFileSync(file));
  if (hash.digest('hex') !== manifest[id].sha256) throw new Error(`Game bundle changed or incomplete: ${id}; run npm run games:sync`);
  const html = readFileSync(join(dir,'index.html'),'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) {
    if (!existsSync(resolve(dir,match[1]))) throw new Error(`Missing entry asset: ${id}/${match[1]}`);
  }
  console.log(`${id}: bundle checksum and entry assets OK`);
}
for (const e of readdirSync(root,{withFileTypes:true})) {
  if (e.isDirectory() && !manifest[e.name]) throw new Error(`Game bundle without manifest entry: ${e.name}`);
}

// Jedes Spiel, das die Seite unter /games/<id>/ startet, muss auch da sein, und
// automatisch aufgenommene Spiele brauchen ihre Bilder.
const window = {};
for (const katalog of ['shop/spiele.js','shop/spiele-auto.js']) new Function('window', readFileSync(join(site,katalog),'utf8'))(window);
for (const spiel of window.MIWALE_SPIELE) {
  if (spiel.spielen.startsWith('/games/') && !manifest[spiel.id]) throw new Error(`Catalog starts ${spiel.spielen}, but there is no bundle for ${spiel.id}`);
  for (const bild of [spiel.bild, ...(spiel.bilder || [])]) if (!existsSync(join(site,bild))) throw new Error(`Missing image for ${spiel.id}: ${bild}`);
  for (const l of ['en','de']) if (!spiel.texte?.[l]?.kurz) throw new Error(`Missing ${l} text for ${spiel.id}`);
}
console.log(`${window.MIWALE_SPIELE.length} games in the catalog, all startable`);
