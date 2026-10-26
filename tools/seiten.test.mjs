// Erzeugte Seiten: Vorschau-Tags, JSON-LD, Sitemap, Feed und Presskit.
// Laeuft gegen das Repository (kein Browser, keine Netzwerkzugriffe).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { katalogLesen, startSeite, spielSeite, presseSeite, presseDateien, presseZip, sitemap, robots, feed, jsonLd, ogBild, SITE } from './seiten-lib.mjs';
import { crc32 } from './zip.mjs';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spiele = katalogLesen(wurzel);
const tag = (html, muster) => (muster.exec(html) || [])[1];
const meta = (html, schluessel) => tag(html, new RegExp(`<meta (?:property|name)="${schluessel}" content="([^"]*)"`));
const entities = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

test('every game page has its own title, description, image and canonical address', () => {
  assert.ok(spiele.length >= 9);
  const titel = new Set();
  for (const sp of spiele) {
    const html = spielSeite(wurzel, sp.id, spiele);
    assert.ok(html, sp.id);
    assert.ok(tag(html, /<title>([^<]*)<[/]title>/).includes(sp.name), sp.id);
    assert.equal(tag(html, /<link rel="canonical" href="([^"]*)"/), `${SITE}/games/${sp.id}`);
    assert.equal(entities(meta(html, 'og:description')), sp.texte.en.kurz, sp.id);
    assert.equal(meta(html, 'og:image'), `${SITE}/${ogBild(wurzel, sp.id)}`);
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
    assert.match(html, /<h1>/);
    assert.ok(html.includes(`/games/${sp.id}/spielen`), 'Spielen-Link im HTML');
    titel.add(meta(html, 'og:title'));
  }
  assert.equal(titel.size, spiele.length, 'jeder Titel kommt nur einmal vor');
});

test('JSON-LD parses and cannot end its script block', () => {
  for (const sp of spiele) {
    const html = spielSeite(wurzel, sp.id, spiele);
    const bloecke = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const spiel = bloecke.find((b) => b['@type'] === 'VideoGame');
    assert.ok(spiel, sp.id);
    assert.equal(spiel.name, sp.name);
    assert.equal(spiel.offers.price, '0');
  }
  assert.ok(!jsonLd({ a: '</script><script>alert(1)</script>' }).includes('</'));
});

test('texts from the catalog are escaped in the page', () => {
  const sp = { id: 'x', name: '<b>"Boese"</b> & Co', texte: { en: { kurz: 'a "b" <i>c</i>', tags: [], ueber: ['<script>alert(1)</script>'], features: [] } }, bild: 'assets/logo-wordmark.png' };
  const html = spielSeite(wurzel, 'x', [sp]);
  assert.ok(!html.includes('<script>alert(1)'));
  assert.ok(!html.includes('<b>"Boese"'));
});

test('start page lists every game as a link', () => {
  const html = startSeite(wurzel, spiele);
  for (const sp of spiele) assert.ok(html.includes(`href="/games/${sp.id}"`), sp.id);
  assert.equal(tag(html, /<link rel="canonical" href="([^"]*)"/), `${SITE}/`);
});

test('sitemap, robots and feed', () => {
  const karte = sitemap(wurzel, spiele);
  for (const sp of spiele) assert.ok(karte.includes(`<loc>${SITE}/games/${sp.id}</loc>`), sp.id);
  assert.ok(karte.includes(`<loc>${SITE}/press/</loc>`));
  assert.ok(!karte.includes('/admin') && !karte.includes('/dev/') && !karte.includes('/usage'));
  const r = robots();
  assert.match(r, /Sitemap: https:\/\/miwale\.com\/sitemap\.xml/);
  for (const p of ['/admin/', '/dev/', '/usage/', '/api/', '/u/', '/profile']) assert.ok(r.includes('Disallow: ' + p), p);
  const f = feed(wurzel, spiele);
  assert.match(f, /^<\?xml/);
  assert.equal([...f.matchAll(/<entry>/g)].length, Math.min(30, spiele.length));
  const ids = [...f.matchAll(/<id>([^<]*)<\/id>/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'Eintrags-IDs sind eindeutig');
});

test('feed includes news from the catalog', () => {
  const sp = { ...spiele[0], neuigkeiten: [{ datum: '2099-01-01', titel: { en: 'Big update', de: 'Grosses Update' }, text: { en: 'Now with more.' } }] };
  const f = feed(wurzel, [sp]);
  assert.ok(f.includes(`${sp.name}: Big update`));
  assert.ok(f.indexOf('2099-01-01') < f.indexOf(sp.veroeffentlicht), 'neueste zuerst');
});

test('press kit zip has valid entries and a fact sheet', () => {
  const zip = presseZip(wurzel, spiele);
  // Zentrales Verzeichnis lesen und jede Datei gegen CRC und Groesse pruefen.
  const ende = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(ende > 0);
  const anzahl = zip.readUInt16LE(ende + 10);
  let o = zip.readUInt32LE(ende + 16);
  const namen = [];
  for (let i = 0; i < anzahl; i++) {
    assert.equal(zip.readUInt32LE(o), 0x02014b50);
    const verfahren = zip.readUInt16LE(o + 10), crc = zip.readUInt32LE(o + 16), kl = zip.readUInt32LE(o + 20), gr = zip.readUInt32LE(o + 24);
    const nl = zip.readUInt16LE(o + 28), lokal = zip.readUInt32LE(o + 42);
    const name = zip.toString('utf8', o + 46, o + 46 + nl);
    const dl = zip.readUInt16LE(lokal + 26), start = lokal + 30 + dl;
    const roh = zip.subarray(start, start + kl);
    const daten = verfahren === 8 ? inflateRawSync(roh) : roh;
    assert.equal(daten.length, gr, name);
    assert.equal(crc32(daten), crc, name);
    namen.push(name);
    o += 46 + nl;
  }
  assert.ok(namen.includes('miwale-presskit/factsheet.txt'));
  assert.ok(namen.includes('miwale-presskit/brand/logo-wordmark-light-text.png'));
  for (const sp of spiele) assert.ok(namen.some((n) => n.startsWith(`miwale-presskit/games/${sp.id}/screenshot-`)), sp.id);
  assert.equal(presseDateien(wurzel, spiele).length, anzahl);
});

test('press page links the download and every game', () => {
  const html = presseSeite(wurzel, spiele, 14);
  assert.ok(html.includes('/press/miwale-presskit.zip'));
  assert.ok(html.includes('michi.waggoner@gmail.com'));
  for (const sp of spiele) assert.ok(html.includes(`href="/games/${sp.id}"`), sp.id);
});

test('share cards exist for the generic page and for every hand-written game', () => {
  // Fuer automatisch aufgenommene Spiele ist die Karte optional: ohne sie faellt die Seite auf die allgemeine zurueck.
  assert.ok(existsSync(join(wurzel, 'assets/og/miwale.jpg')), 'node tools/og-bilder.mjs');
  const handgeschrieben = new Set([...readFileSync(join(wurzel, 'shop/spiele.js'), 'utf8').matchAll(/^ {4}"id": "([a-z0-9-]+)"/gm)].map((m) => m[1]));
  for (const id of handgeschrieben) assert.ok(existsSync(join(wurzel, 'assets/og', id + '.jpg')), `assets/og/${id}.jpg fehlt: node tools/og-bilder.mjs`);
});
