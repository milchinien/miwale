// The portfolio is a static DC document, not a compiled Vite application.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './check-games.mjs';
import { schreiben } from './seiten.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root,'dist');
if (dirname(output) !== root) throw new Error('Invalid site output');
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
for (const file of ['index.html','shop','miwale Portfolio.dc.html','support.js','_ds','assets']) cpSync(join(root,file),join(output,file),{recursive:true});
cpSync(join(root,'public'),output,{recursive:true});
// Spielseiten fuer Vorschauen und Suchmaschinen, Presskit, robots.txt, sitemap.xml, feed.xml
// aus dem Katalog; dist hat dieselbe Gestalt wie das Image (siehe Dockerfile).
const erzeugt = schreiben({ wurzel: output, ziel: output });
console.log(`Generated ${erzeugt.spiele} game pages, press kit (${erzeugt.zipMB} MB), robots.txt, sitemap.xml, feed.xml.`);
console.log('Built games page, responsive portfolio, assets and all frozen games.');
