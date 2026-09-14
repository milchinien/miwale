import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { gamesPreview } from './games-preview.mjs';

test('game preview serves newly synced files and correct image/script types', async (t) => {
  let handler;
  gamesPreview().configureServer({middlewares:{use(_prefix,fn){handler=fn;}}});
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  // Created after server startup: reproduces Vite's stale public-file index.
  const probe = new URL(`../public/games/.preview-${process.pid}.js`, import.meta.url);
  writeFileSync(probe,'export const ready = true;', {flag:'wx'});
  t.after(() => unlinkSync(probe));
  let response = await fetch(`${base}/.preview-${process.pid}.js`);
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/javascript/);
  assert.equal(await response.text(),'export const ready = true;');
  response = await fetch(`${base}/wavebreaker/icons/upgrades/hammerfall.svg`);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/svg+xml');
  assert.match(await response.text(),/<svg/);
  for (const id of ['wavebreaker','chromatic','runecall','harmonics']) {
    const html = readFileSync(new URL(`../public/games/${id}/index.html`,import.meta.url),'utf8');
    const script = html.match(/src="\.\/([^"]+\.js)"/)[1];
    response = await fetch(`${base}/${id}/${script}`);
    assert.equal(response.status,200,id);
    assert.match(response.headers.get('content-type'),/javascript/,id);
  }
  response = await fetch(`${base}/wavebreaker/missing.svg`);
  assert.equal(response.status,404);
  assert.doesNotMatch(await response.text(),/<html/i);
});
