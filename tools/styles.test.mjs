// Game Style Library: every style is complete and valid, and the generated files are up to date.
// The browser check (starter.js really draws) is tools/check-styles.mjs – it needs Playwright.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ORDER, readStyle, styleIds, validate, stylesDir } from './styles-lib.mjs';
import { build } from './build-styles.mjs';
import { ohneKlein } from './shots-klein.mjs';

test('every style of the reference game has a library entry', () => {
  const ids = styleIds();
  for (const id of ORDER) assert.ok(ids.includes(id), `library/${id}/ missing`);
  for (const id of ids) assert.ok(existsSync(join(stylesDir, 'js', 'styles', id + '.js')), `${id}: no reference module js/styles/${id}.js`);
});

test('every preview image has a small version for the galleries', () => {
  // Galerie, Mixer und Collagen laden shots/klein/; ohne sie bliebe die Kachel leer.
  assert.deepEqual(ohneKlein(), [], 'node tools/shots-klein.mjs');
});

test('spec.json, STYLE.md and starter.js follow AUTHORING.md', () => {
  for (const id of styleIds()) assert.deepEqual(validate(readStyle(id)), [], id);
});

test('palette in spec.json matches the hex values the reference module uses', () => {
  for (const id of styleIds()) {
    const { spec } = readStyle(id);
    const mod = readFileSync(join(stylesDir, 'js', 'styles', id + '.js'), 'utf8').toLowerCase();
    // modules write colours as '#rrggbb' or as [r, g, b] arrays
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const asArray = (h) => new RegExp('\\[\\s*' + rgb(h).join('\\s*,\\s*') + '\\s*\\]');
    const missing = spec.palette.filter((c) => !mod.includes(c.hex.toLowerCase()) && !asArray(c.hex).test(mod));
    // a few colours may be derived (mixed/tinted) in code; most must be literal
    assert.ok(missing.length <= Math.floor(spec.palette.length / 3), `${id}: palette colours not found in module: ${missing.map((c) => c.hex).join(' ')}`);
  }
});

test('starter.js registers itself without a browser', () => {
  for (const id of styleIds()) {
    const { starter } = readStyle(id);
    const sandbox = { module: { exports: {} } };
    sandbox.globalThis = sandbox;
    vm.runInNewContext(starter, sandbox, { filename: `${id}/starter.js` });
    const st = sandbox.StyleStarters && sandbox.StyleStarters[id];
    assert.ok(st, `${id}: StyleStarters['${id}'] missing`);
    assert.equal(typeof st.draw, 'function', `${id}: draw() missing`);
    assert.equal(st.id, id);
  }
});

test('generated catalog, llms.txt and llms-full.txt are up to date (run node tools/build-styles.mjs)', () => {
  const { problems, files } = build();
  assert.deepEqual(problems, []);
  for (const [path, text] of Object.entries(files)) {
    assert.ok(existsSync(path), path + ' missing');
    // Windows checkouts may turn LF into CRLF; the generator always writes LF
    assert.equal(readFileSync(path, 'utf8').replace(/\r\n/g, '\n'), text, path + ' is stale');
  }
  const catalog = JSON.parse(files[join(stylesDir, 'styles.json')]);
  assert.equal(catalog.styles.length, styleIds().length);
});

test('page scripts parse', () => {
  for (const f of ['js/library.js', 'js/md.js', 'js/lib.js', 'js/design.js', 'js/mix.js', 'js/stage.js', 'js/main.js']) {
    new vm.Script(readFileSync(join(stylesDir, f), 'utf8'), { filename: f });
  }
});
