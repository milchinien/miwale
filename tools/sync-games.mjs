// Freeze the tested production builds into the portfolio, including public assets.
// Run after changes in sibling game repositories: npm run games:sync
// Only some games: npm run games:sync -- reliktenschieber
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projects = [
  ['wavebreaker', 'Wavebreaker', 'dist'],
  ['chromatic', 'Chromatic', 'dist'],
  ['runecall', 'Runecall', 'packages/client/dist'],
  ['harmonics', 'Harmonics', 'dist'],
  ['reliktenschieber', 'Coin Pusher', 'dist'],
];
// Named ids rebuild only those games; the other entries in the manifest stay.
const only = process.argv.slice(2);
for (const id of only) if (!projects.some(([p]) => p === id)) throw new Error(`Unknown game: ${id}`);
const output = join(root, 'public/games');
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]);
const manifestFile = join(output,'manifest.json');
const manifest = only.length && existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile,'utf8')) : {};
for (const [id, repo, dist] of projects) {
  if (only.length && !only.includes(id)) continue;
  const source = resolve(root, '..', repo);
  if (!existsSync(join(source,'package.json'))) throw new Error(`Missing game checkout: ${source}`);
  execFileSync(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d','/s','/c','npm run build'] : ['run','build'], { cwd: source, stdio: 'inherit' });
  const target = join(output, id);
  if (relative(output,target).startsWith('..') || dirname(target) !== output) throw new Error('Invalid bundle target');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(join(source,dist),target,{recursive:true,filter: f => !f.endsWith('.map')});
  const checksum = createHash('sha256');
  for (const file of files(target).sort()) checksum.update(relative(target,file).replaceAll('\\','/')).update(readFileSync(file));
  manifest[id] = { path: `games/${id}/`, sha256: checksum.digest('hex') };
}
const sorted = Object.fromEntries(projects.map(([id]) => id).filter(id => manifest[id]).map(id => [id, manifest[id]]));
writeFileSync(manifestFile,JSON.stringify(sorted,null,2)+'\n');
console.log(`Updated ${only.length || projects.length} production game bundle(s) in public/games.`);
