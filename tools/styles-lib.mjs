// Shared helpers for the Game Style Library (public/styles/library/): reading, validating.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const stylesDir = join(root, 'public', 'styles');
export const libraryDir = join(stylesDir, 'library');

export const HEADINGS = [
  'At a glance', 'When to use it', 'Color palette', 'Typography', 'Rendering technique',
  'Background and ground', 'Characters', 'Enemies and props', 'Effects and particles',
  'Lighting, shadows and post-processing', 'UI and HUD', 'Motion and animation', 'Do and don\'t',
  'Implementation recipe', 'Code', 'Adapting it to your game', 'Performance notes', 'Copy-paste prompt',
];

/** Style ids in the order of the gallery (= order of the modules in index.html of the old gallery). */
export const ORDER = [
  'harvest16', 'kuerbisboy', 'gothic', 'dusk', 'cartoon', 'paper', 'watercolor', 'neon', 'lowpoly', 'linocut',
  'nes8bit', 'stainedglass', 'clay', 'chalk', 'candy', 'crossstitch', 'popart', 'vangogh', 'shadow', 'voxel',
];

export function styleIds() {
  const found = readdirSync(libraryDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);
  const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
  return found.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function readStyle(id) {
  const dir = join(libraryDir, id);
  // CRLF (Windows checkouts) -> LF, so generated files are identical on every machine
  const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n') : null);
  const specText = read('spec.json');
  let spec = null, specError = null;
  if (specText !== null) {
    try { spec = JSON.parse(specText); } catch (e) { specError = e.message; }
  }
  return { id, dir, spec, specError, md: read('STYLE.md'), starter: read('starter.js') };
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isStrList = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every(isStr);
const HEX = /^#[0-9a-f]{6}$/i;

/** Returns a list of problems (empty = valid). */
export function validate(style) {
  const p = [];
  const { id, spec, md, starter } = style;
  if (style.specError) p.push('spec.json: invalid JSON – ' + style.specError);
  else if (!spec) p.push('spec.json missing');
  else {
    if (spec.id !== id) p.push(`spec.json: id "${spec.id}" != folder "${id}"`);
    for (const k of ['name', 'originalName', 'family', 'summary', 'description', 'performance']) if (!isStr(spec[k])) p.push(`spec.json: ${k} missing`);
    if (isStr(spec.summary) && spec.summary.length > 160) p.push('spec.json: summary longer than 160 chars');
    for (const k of ['tags', 'mood', 'bestFor', 'avoidFor', 'paletteRules', 'motion', 'do', 'dont']) if (!isStrList(spec[k])) p.push(`spec.json: ${k} must be a non-empty string list`);
    const d = spec.difficulty;
    if (!d || !Number.isInteger(d.stars) || d.stars < 1 || d.stars > 10 || !isStr(d.why)) p.push('spec.json: difficulty {stars 1–10, why}');
    const t = spec.technique || {};
    for (const k of ['renderer', 'resolution', 'summary', 'linework', 'shading', 'lighting', 'texture']) if (!isStr(t[k])) p.push(`spec.json: technique.${k} missing`);
    if (!('pixelArt' in t)) p.push('spec.json: technique.pixelArt missing (false or {scale})');
    if (!Array.isArray(spec.palette) || spec.palette.length < 6) p.push('spec.json: palette needs ≥ 6 entries');
    else spec.palette.forEach((c, i) => {
      if (!isStr(c.name) || !isStr(c.role) || !HEX.test(c.hex || '')) p.push(`spec.json: palette[${i}] needs name, role and #rrggbb hex`);
    });
    if (!Array.isArray(spec.typography) || !spec.typography.length) p.push('spec.json: typography needs ≥ 1 entry');
    else spec.typography.forEach((f, i) => {
      if (!isStr(f.family) || !isStr(f.role) || !isStr(f.css) || !isStr(f.sample)) p.push(`spec.json: typography[${i}] needs family, role, sample, css`);
    });
    if (!spec.background || !isStr(spec.background.summary) || !isStrList(spec.background.layers)) p.push('spec.json: background {summary, layers[]}');
    if (!spec.characters || !isStr(spec.characters.summary) || !isStrList(spec.characters.rules)) p.push('spec.json: characters {summary, rules[]}');
    if (!Array.isArray(spec.effects) || spec.effects.length < 3 || !spec.effects.every((e) => isStr(e.name) && isStr(e.how))) p.push('spec.json: effects needs ≥ 3 {name, how}');
    if (!spec.ui || !isStr(spec.ui.summary) || !isStr(spec.ui.css)) p.push('spec.json: ui {summary, css}');
  }
  if (!md) p.push('STYLE.md missing');
  else {
    const found = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    let at = -1;
    for (const h of HEADINGS) {
      const i = found.indexOf(h);
      if (i < 0) p.push(`STYLE.md: heading "## ${h}" missing`);
      else if (i < at) p.push(`STYLE.md: heading "## ${h}" out of order`);
      else at = i;
    }
    if (!/^# .+/m.test(md)) p.push('STYLE.md: "# <Name> — Game Art Style Spec" title missing');
  }
  if (!starter) p.push('starter.js missing');
  else {
    if (!starter.includes(`StyleStarters['${id}']`) && !starter.includes(`StyleStarters["${id}"]`)) p.push(`starter.js: must register StyleStarters['${id}']`);
    if (/\bwindow\.U\b|\bU\.\w+\(|\bG\.\w+\(/.test(starter)) p.push('starter.js: must not use the game helpers U./G.');
    if (/\b(fetch|XMLHttpRequest|import\s*\()/.test(starter)) p.push('starter.js: no network access allowed');
  }
  return p;
}

/** Splits STYLE.md into { title, intro, sections: {heading: body} }. */
export function sections(md) {
  const out = { title: '', intro: '', sections: {} };
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let cur = null, buf = [];
  const flush = () => {
    const body = buf.join('\n').trim();
    if (cur === null) out.intro = body; else out.sections[cur] = body;
    buf = [];
  };
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && /^# /.test(line) && !out.title) { out.title = line.slice(2).trim(); continue; }
    const m = !inFence && /^## (.+)$/.exec(line);
    if (m) { flush(); cur = m[1].trim(); continue; }
    buf.push(line);
  }
  flush();
  return out;
}
