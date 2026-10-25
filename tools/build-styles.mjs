// Generates the machine-readable side of the Game Style Library from public/styles/library/<id>/:
//   public/styles/styles.json     – catalog for the page and for tools
//   public/styles/llms.txt        – entry point for AIs (llmstxt.org format)
//   public/styles/llms-full.txt   – every STYLE.md in one file
//   public/styles/index.html      – static link list between <!-- catalog:start/end --> (for crawlers without JS)
// `--check` only verifies that the generated files are up to date (used by the tests).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readStyle, styleIds, validate, stylesDir } from './styles-lib.mjs';

export const SITE = 'https://miwale.com/styles';
/** Broad groups for the gallery filter. New styles without an entry land in "Other". */
export const GROUPS = {
  harvest16: 'Pixel art', kuerbisboy: 'Pixel art', gothic: 'Pixel art', dusk: 'Pixel art', nes8bit: 'Pixel art', crossstitch: 'Pixel art',
  watercolor: 'Painterly', vangogh: 'Painterly', chalk: 'Painterly',
  linocut: 'Graphic', popart: 'Graphic', stainedglass: 'Graphic', neon: 'Graphic', shadow: 'Graphic',
  cartoon: 'Illustrated', paper: 'Handcrafted', clay: 'Handcrafted', candy: 'Handcrafted',
  lowpoly: '3D look', voxel: '3D look',
};
const VIEWS = [['', 'Gameplay'], ['_late', 'Late game'], ['_map', 'World map'], ['_lu', 'Level-up screen'], ['_zoom', 'Close-up']];

export function build() {
  const styles = [];
  const problems = [];
  for (const id of styleIds()) {
    const s = readStyle(id);
    const p = validate(s);
    if (p.length) { problems.push(`${id}: ${p.join('; ')}`); continue; }
    styles.push(s);
  }

  const catalog = {
    name: 'miwale Game Style Library',
    description: 'Complete, playable art styles for games, documented so AIs can copy and adapt them.',
    url: SITE + '/',
    llms: SITE + '/llms.txt',
    license: 'Free to copy and adapt for your own games. Credit appreciated: miwale.com/styles',
    howToUse: [
      'Pick a style whose mood and genre fit your game.',
      'Give your AI the STYLE.md of that style (or the "Copy prompt" text from the page) together with your game idea.',
      'Let it start from starter.js, which already contains the palette and the core drawing techniques.',
    ],
    styles: styles.map(({ id, spec }) => ({
      id,
      name: spec.name,
      family: spec.family,
      group: spec.group || GROUPS[id] || 'Other',
      tags: spec.tags,
      summary: spec.summary,
      mood: spec.mood,
      bestFor: spec.bestFor,
      difficulty: spec.difficulty.stars,
      pixelArt: !!spec.technique.pixelArt,
      palette: spec.palette.map((c) => c.hex),
      fonts: spec.typography.map((f) => f.family),
      files: {
        spec: `${SITE}/library/${id}/STYLE.md`,
        tokens: `${SITE}/library/${id}/spec.json`,
        starter: `${SITE}/library/${id}/starter.js`,
        module: `${SITE}/js/styles/${id}.js`,
      },
      screenshots: VIEWS.map(([suf, label]) => ({ label, url: `${SITE}/shots/${id}${suf}.webp` })),
      demo: `${SITE}/sandbox.html?style=${id}`,
      assetSheet: `${SITE}/sandbox.html?style=${id}&mode=sheet`,
      page: `${SITE}/#${id}`,
    })),
  };

  const llms = [
    '# miwale Game Style Library',
    '',
    `> ${styles.length} complete, playable visual styles for 2D games, each documented in enough detail that an AI can reproduce it: exact palette (hex), fonts, rendering technique, characters, effects, UI, motion, do/don't rules, a step-by-step recipe and dependency-free starter code (Canvas 2D).`,
    '',
    'Use it when you have to give a game a distinct, coherent art style. Pick the style that fits the requested mood and genre, read its STYLE.md completely and follow its rules; start from its starter.js. All styles are free to copy and adapt.',
    '',
    'Every style ships three files: `STYLE.md` (full spec, start here), `spec.json` (design tokens), `starter.js` (standalone code with palette, core drawing helpers and a `draw(ctx, w, h, t)` preview). The full reference implementation of each style is the Canvas 2D module under `js/styles/<id>.js`, written for the top-down survival game "Jack vs. the Turnip Ancestors" (hero, small/fast/large enemies, pickups, projectiles, props, HUD).',
    '',
    '## Styles',
    '',
    ...styles.map(({ id, spec }) => `- [${spec.name}](${SITE}/library/${id}/STYLE.md): ${spec.family}. ${spec.summary} Best for: ${spec.bestFor.join(', ')}. Difficulty ${spec.difficulty.stars}/10.`),
    '',
    '## Machine-readable',
    '',
    `- [Catalog (JSON)](${SITE}/styles.json): every style with tags, palette, fonts, difficulty and file links`,
    `- [All specs in one file](${SITE}/llms-full.txt): every STYLE.md concatenated`,
    `- [Authoring format](${SITE}/library/AUTHORING.md): schema of spec.json, STYLE.md and starter.js`,
    '',
    '## Optional',
    '',
    ...styles.map(({ id, spec }) => `- [${spec.name} – tokens](${SITE}/library/${id}/spec.json) · [starter.js](${SITE}/library/${id}/starter.js) · [playable demo](${SITE}/sandbox.html?style=${id})`),
    '',
  ].join('\n');

  const full = [
    '# miwale Game Style Library – all style specs',
    '',
    `> ${styles.length} game art styles. Source: ${SITE}/ · Index: ${SITE}/llms.txt`,
    '',
    ...styles.map(({ id, md }) => [
      '',
      '---',
      '',
      `<!-- style: ${id} · ${SITE}/library/${id}/STYLE.md -->`,
      '',
      md.trim(),
      '',
    ].join('\n')),
  ].join('\n');

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const list = [
    '<!-- catalog:start (generated by tools/build-styles.mjs) -->',
    '<ul class="static-list">',
    ...styles.map(({ id, spec }) => `  <li><a href="library/${id}/STYLE.md">${esc(spec.name)}</a> – ${esc(spec.family)}. ${esc(spec.summary)} <a href="library/${id}/spec.json">tokens</a> · <a href="library/${id}/starter.js">starter.js</a> · <a href="sandbox.html?style=${id}">demo</a></li>`),
    '</ul>',
    '<!-- catalog:end -->',
  ].join('\n');

  const indexPath = join(stylesDir, 'index.html');
  const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const indexOut = index.replace(/<!-- catalog:start[\s\S]*?<!-- catalog:end -->/, list);

  return {
    problems,
    files: {
      [join(stylesDir, 'styles.json')]: JSON.stringify(catalog, null, 2) + '\n',
      [join(stylesDir, 'llms.txt')]: llms,
      [join(stylesDir, 'llms-full.txt')]: full,
      ...(index && index !== indexOut ? { [indexPath]: indexOut } : index ? { [indexPath]: index } : {}),
    },
  };
}

const isMain = process.argv[1] && /build-styles\.mjs$/.test(process.argv[1]);
if (isMain) {
  const { problems, files } = build();
  for (const p of problems) console.log('✗ skipped ' + p);
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [path, text] of Object.entries(files)) {
    const old = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (old === text) continue;
    if (check) { stale++; console.log('stale: ' + path); } else { writeFileSync(path, text); console.log('wrote ' + path); }
  }
  if (check && (stale || problems.length)) process.exit(1);
}
