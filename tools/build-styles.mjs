// Generates everything of the Game Style Library that is derived from public/styles/library/<id>/:
//   public/styles/styles.json        – catalog for the pages and for tools
//   public/styles/llms.txt           – entry point for AIs (llmstxt.org format)
//   public/styles/llms-full.txt      – every STYLE.md in one file
//   public/styles/<id>/index.html    – the design page of each style (from design.html, with the spec pre-rendered)
//   public/styles/design/index.html  – the design page for custom mixes
//   public/styles/index.html         – static link list between <!-- catalog:start/end --> (for crawlers without JS)
// `--check` only verifies that the generated files are up to date (used by the tests).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { readStyle, styleIds, validate, stylesDir, ORIGINALS, VARIANTS } from './styles-lib.mjs';

export const SITE = 'https://miwale.com/styles';
/** Broad groups for the gallery filter. New styles without an entry land in "Other". */
export const GROUPS = {
  harvest16: 'Pixel art', kuerbisboy: 'Pixel art', gothic: 'Pixel art', dusk: 'Pixel art', nes8bit: 'Pixel art', crossstitch: 'Pixel art',
  watercolor: 'Painterly', vangogh: 'Painterly', chalk: 'Painterly',
  linocut: 'Graphic', popart: 'Graphic', stainedglass: 'Graphic', neon: 'Graphic', shadow: 'Graphic',
  cartoon: 'Illustrated', paper: 'Handcrafted', clay: 'Handcrafted', candy: 'Handcrafted',
  lowpoly: '3D look', voxel: '3D look',
  blueprint: 'Graphic', ukiyoe: 'Graphic', thermal: 'Digital', terminal: 'Digital', origami: 'Handcrafted',
  rubberhose: 'Illustrated', vaporwave: 'Digital', sumie: 'Painterly', bricks: '3D look',
  riso: 'Graphic', crayon: 'Illustrated', deepsea: 'Illustrated', artdeco: 'Graphic',
};
const VIEWS = [['', 'Scene'], ['_late', 'Dense scene'], ['_map', 'Wide view'], ['_lu', 'UI overlay'], ['_zoom', 'Close-up']];
const ELEMENTS = [['world', 'World'], ['characters', 'Characters'], ['props', 'Props'], ['effects', 'Effects'], ['atmosphere', 'Atmosphere'], ['ui', 'UI & type']];
const STAGE = { world: 'world', characters: 'characters', props: 'props', effects: 'effects', atmosphere: 'atmosphere', ui: 'ui' };

/** The page's own Markdown renderer (public/styles/js/md.js), run in Node for the pre-rendered spec. */
function markdown() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(stylesDir, 'js', 'md.js'), 'utf8'), sandbox);
  return sandbox.window.MD;
}

export function build() {
  const styles = [];
  const problems = [];
  for (const id of styleIds()) {
    const s = readStyle(id);
    const p = validate(s);
    if (p.length) { problems.push(`${id}: ${p.join('; ')}`); continue; }
    styles.push(s);
  }
  const MD = markdown();
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const catalog = {
    name: 'miwale Game Style Library',
    description: 'Complete art styles for games, split into separable design elements and documented so AIs can copy, adapt and mix them.',
    url: SITE + '/',
    llms: SITE + '/llms.txt',
    mixer: SITE + '/mix/',
    license: 'Free to copy and adapt for your own projects. Credit appreciated: miwale.com/styles',
    elements: ELEMENTS.map(([key, name]) => ({ key, name })),
    howToUse: [
      'Pick a style whose mood fits your project – or mix elements of several styles in the mixer.',
      'Give your AI the STYLE.md of that style (or the "Copy prompt" text from the page) together with a description of your project.',
      'Let it start from starter.js, which already contains the palette and the core drawing techniques.',
    ],
    styles: styles.map(({ id, spec }) => ({
      id,
      name: spec.name,
      family: spec.family,
      group: spec.group || GROUPS[id] || 'Other',
      original: ORIGINALS.includes(id),
      ...(VARIANTS[id] ? { variantOf: VARIANTS[id] } : {}),
      tags: spec.tags,
      summary: spec.summary,
      mood: spec.mood,
      bestFor: spec.bestFor,
      difficulty: spec.difficulty.stars,
      pixelArt: !!spec.technique.pixelArt,
      palette: spec.palette.map((c) => c.hex),
      fonts: spec.typography.map((f) => f.family),
      page: `${SITE}/${id}/`,
      files: {
        spec: `${SITE}/library/${id}/STYLE.md`,
        tokens: `${SITE}/library/${id}/spec.json`,
        starter: `${SITE}/library/${id}/starter.js`,
        module: `${SITE}/js/styles/${id}.js`,
      },
      previews: Object.fromEntries([['scene', 'scene']].concat(ELEMENTS.map(([k]) => [k, STAGE[k]])).map(([k, v]) => [k, `${SITE}/stage.html?style=${id}&view=${v}`])),
      screenshots: VIEWS.map(([suf, label]) => ({ label, url: `${SITE}/shots/${id}${suf}.webp` })),
    })),
  };

  const llms = [
    '# miwale Game Style Library',
    '',
    `> ${styles.length} complete visual styles for 2D games, each documented in enough detail that an AI can reproduce it: exact palette (hex), fonts, rendering technique, and the six design elements – world, characters, props, effects, atmosphere, UI – plus motion, do/don't rules, a step-by-step recipe and dependency-free starter code (Canvas 2D).`,
    '',
    'Use it when you have to give a project a distinct, coherent art style. Pick the style that fits the requested mood, read its STYLE.md completely and follow its rules; start from its starter.js. Elements of different styles can be combined – every element section of a STYLE.md stands on its own. All styles are free to copy and adapt.',
    '',
    'Every style ships three files: `STYLE.md` (full spec, start here), `spec.json` (design tokens grouped by element), `starter.js` (standalone code with palette, core drawing helpers and a `draw(ctx, w, h, t)` preview). The visual reference of each style is the Canvas 2D module under `js/styles/<id>.js`.',
    '',
    '## Styles',
    '',
    ...styles.map(({ id, spec }) => `- [${spec.name}](${SITE}/library/${id}/STYLE.md): ${spec.family}. ${spec.summary} Best for: ${spec.bestFor.join(', ')}. Complexity ${spec.difficulty.stars}/10.`),
    '',
    '## Machine-readable',
    '',
    `- [Catalog (JSON)](${SITE}/styles.json): every style with tags, palette, fonts, complexity and file links`,
    `- [All specs in one file](${SITE}/llms-full.txt): every STYLE.md concatenated`,
    `- [Authoring format](${SITE}/library/AUTHORING.md): schema of spec.json, STYLE.md and starter.js, and the design elements`,
    '',
    '## Optional',
    '',
    `- [Mix your own design](${SITE}/mix/): combine the elements of different styles`,
    ...styles.map(({ id, spec }) => `- [${spec.name} – page](${SITE}/${id}/) · [tokens](${SITE}/library/${id}/spec.json) · [starter.js](${SITE}/library/${id}/starter.js)`),
    '',
  ].join('\n');

  const full = [
    '# miwale Game Style Library – all style specs',
    '',
    `> ${styles.length} art styles. Source: ${SITE}/ · Index: ${SITE}/llms.txt`,
    '',
    ...styles.map(({ id, md }) => ['', '---', '', `<!-- style: ${id} · ${SITE}/library/${id}/STYLE.md -->`, '', md.trim(), ''].join('\n')),
  ].join('\n');

  const list = [
    '<!-- catalog:start (generated by tools/build-styles.mjs) -->',
    '<ul class="static-list">',
    ...styles.map(({ id, spec }) => `  <li><a href="${id}/">${esc(spec.name)}</a> – ${esc(spec.family)}. ${esc(spec.summary)} <a href="library/${id}/STYLE.md">STYLE.md</a> · <a href="library/${id}/spec.json">tokens</a> · <a href="library/${id}/starter.js">starter.js</a></li>`),
    '</ul>',
    '<!-- catalog:end -->',
  ].join('\n');

  const files = {
    [join(stylesDir, 'styles.json')]: JSON.stringify(catalog, null, 2) + '\n',
    [join(stylesDir, 'llms.txt')]: llms,
    [join(stylesDir, 'llms-full.txt')]: full,
  };

  const indexPath = join(stylesDir, 'index.html');
  if (existsSync(indexPath)) files[indexPath] = readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n').replace(/<!-- catalog:start[\s\S]*?<!-- catalog:end -->/, list);

  // design pages
  const tpl = readFileSync(join(stylesDir, 'design.html'), 'utf8').replace(/\r\n/g, '\n');
  const page = (v) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m));
  for (const { id, spec, md } of styles) {
    files[join(stylesDir, id, 'index.html')] = page({
      id,
      title: esc(spec.name) + ' – art style for games · miwale Game Style Library',
      description: esc(spec.summary + ' Palette, fonts, world, characters, props, effects, atmosphere and UI – documented for AIs.'),
      image: `${SITE}/shots/${id}.webp`,
      md: `library/${id}/STYLE.md`,
      static: MD.render(md),
    });
  }
  files[join(stylesDir, 'design', 'index.html')] = page({
    id: '',
    title: 'Custom mix · miwale Game Style Library',
    description: 'A custom art style mixed from the elements of several styles of the miwale Game Style Library.',
    image: `${SITE}/shots/cartoon.webp`,
    md: 'llms.txt',
    static: '<p>This page shows a custom mix of design elements. <a href="mix/">Open the mixer</a> or <a href="./">browse all styles</a>.</p>',
  });

  return { problems, files };
}

const isMain = process.argv[1] && /build-styles\.mjs$/.test(process.argv[1]);
if (isMain) {
  const { problems, files } = build();
  for (const p of problems) console.log('✗ skipped ' + p);
  const check = process.argv.includes('--check');
  let stale = 0, wrote = 0;
  for (const [path, text] of Object.entries(files)) {
    const old = existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : null;
    if (old === text) continue;
    if (check) { stale++; console.log('stale: ' + path); } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); wrote++; }
  }
  if (!check) console.log(`wrote ${wrote} of ${Object.keys(files).length} files`);
  if (check && (stale || problems.length)) process.exit(1);
}
