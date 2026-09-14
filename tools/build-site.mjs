// The portfolio is a static DC document, not a compiled Vite application.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './check-games.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root,'dist');
if (dirname(output) !== root) throw new Error('Invalid site output');
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
for (const file of ['index.html','miwale Portfolio.dc.html','miwale Portfolio Mobil.dc.html','support.js','_ds','assets']) cpSync(join(root,file),join(output,file),{recursive:true});
cpSync(join(root,'public'),output,{recursive:true});
console.log('Built complete portfolio with desktop, mobile, assets and four games.');
