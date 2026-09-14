import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../public/games');
const manifest = JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const files = dir => readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]);
for (const id of ['wavebreaker','chromatic','runecall','harmonics']) {
  const dir = join(root,id);
  const hash = createHash('sha256');
  for (const file of files(dir).sort()) hash.update(relative(dir,file).replaceAll('\\','/')).update(readFileSync(file));
  if (hash.digest('hex') !== manifest[id].sha256) throw new Error(`Game bundle changed or incomplete: ${id}; run npm run games:sync`);
  const html = readFileSync(join(dir,'index.html'),'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) {
    if (!existsSync(resolve(dir,match[1]))) throw new Error(`Missing entry asset: ${id}/${match[1]}`);
  }
  console.log(`${id}: bundle checksum and entry assets OK`);
}
