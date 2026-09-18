// Holt alle Spiele von GitHub auf miwale.com. Laeuft taeglich als GitHub Action
// (.github/workflows/spiele.yml) und von Hand: npm run games:sync
//
// Fuer jedes oeffentliche Repository des Kontos (tools/spiele-quellen.json):
//   klonen -> installieren -> bauen -> Kern-Pruefung (tools/kern-pruefung.mjs)
// Neue Repositories kommen nur dazu, wenn sie sich als Spiel markieren: GitHub-
// Topic "miwale" oder eine miwale.json. Die Pruefung allein erkennt kein Spiel.
// Nur was die Pruefung besteht, wird unter public/games/<id>/ eingefroren. Faellt
// eine neue Fassung durch, bleibt die alte stehen; die Seite geht nie kaputt,
// weil ein Spiel gerade umgebaut wird.
//
// Spiele mit Eintrag in shop/spiele.js (von Hand, mit Texten fuer Spieler) werden
// nur neu gebaut. Alle anderen bekommen einen Eintrag in shop/spiele-auto.js,
// mit Texten aus miwale.json im Spiel-Repository oder aus Beschreibung und README,
// und mit Bildern aus der Pruefung.
//
//   npm run games:sync                    alle, unveraenderte Repositories auslassen
//   npm run games:sync -- chromatic       nur diese ids
//   npm run games:sync -- --alle-neu      auch unveraenderte neu bauen
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { kernPruefen } from './kern-pruefung.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLEN = JSON.parse(readFileSync(join(root, 'tools/spiele-quellen.json'), 'utf8'));
const AUSGABE = join(root, 'public/games');
const MANIFEST = join(AUSGABE, 'manifest.json');
const AUTO_KATALOG = join(root, 'shop/spiele-auto.js');
const AUTO_BILDER = join(root, 'assets/games/auto');
const CACHE = join(root, '.spiele-cache');
const BAU = join(CACHE, '_bau');
const HOECHSTENS_MB = 200; // Chromatic hat mit Musik und Bossbildern rund 115 MB
const NEU_TAGE = 30;
const FREIGABE_TOPIC = 'miwale';

const argumente = process.argv.slice(2);
const nur = argumente.filter((a) => !a.startsWith('--'));
const alleNeu = argumente.includes('--alle-neu');

// ---- Helfer ---------------------------------------------------------------------
const dateien = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? dateien(join(dir, e.name)) : [join(dir, e.name)]);
const groesse = (dir) => dateien(dir).reduce((s, f) => s + statSync(f).size, 0);
const pruefsumme = (dir) => {
  const h = createHash('sha256');
  for (const f of dateien(dir).sort()) h.update(relative(dir, f).replaceAll('\\', '/')).update(readFileSync(f));
  return h.digest('hex');
};
const lesenJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
const kennung = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aufrufen = (befehl, cwd) => {
  console.log(`  $ ${befehl}`);
  execSync(befehl, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' }, timeout: 15 * 60 * 1000 });
};
const versuchen = (befehle, cwd) => {
  for (const [i, b] of befehle.entries()) {
    try { return aufrufen(b, cwd); } catch (e) { if (i === befehle.length - 1) throw e; }
  }
};
// Nur Ordner innerhalb von public/games/ loeschen, nie etwas daneben.
const spielOrdner = (id) => {
  const ziel = join(AUSGABE, id);
  if (!/^[a-z0-9-]+$/.test(id) || dirname(ziel) !== AUSGABE) throw new Error(`Ungueltige id: ${id}`);
  return ziel;
};

function token() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  try { return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}

let schluessel;
const api = (pfad) => {
  const t = schluessel ??= token();
  return fetch(`https://api.github.com${pfad}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'miwale-spiele-sync', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
  });
};

async function repositories() {
  const liste = [];
  for (let seite = 1; ; seite++) {
    const r = await api(`/users/${QUELLEN.konto}/repos?type=owner&per_page=100&page=${seite}`);
    if (!r.ok) throw new Error(`GitHub antwortet ${r.status}: ${await r.text()}`);
    const teil = await r.json();
    liste.push(...teil);
    if (teil.length < 100) break;
  }
  // Nur Oeffentliches: was auf miwale.com landet, ist fuer alle sichtbar.
  return liste.filter((r) => !r.private && !r.fork && !r.archived && r.size > 0);
}

// Die Kataloge sind Skripte fuer den Browser; hier mit einem Ersatz-window lesen.
function katalogLesen(datei, vorher = []) {
  if (!existsSync(datei)) return vorher;
  const fenster = { MIWALE_SPIELE: [...vorher] };
  new Function('window', readFileSync(datei, 'utf8'))(fenster);
  return fenster.MIWALE_SPIELE;
}

// ---- Klonen, erkennen, bauen ------------------------------------------------------
function klonen(repo) {
  const ziel = join(CACHE, repo.name);
  if (existsSync(join(ziel, '.git'))) {
    aufrufen(`git fetch --depth 1 origin ${repo.default_branch}`, ziel);
    aufrufen('git reset --hard FETCH_HEAD', ziel);
    // Alte Build-Ausgaben weg, node_modules behalten: das spart die Installation.
    aufrufen('git clean -ffdx -e node_modules', ziel);
  } else {
    mkdirSync(CACHE, { recursive: true });
    aufrufen(`git clone --depth 1 --branch ${repo.default_branch} ${repo.clone_url} "${ziel}"`, root);
  }
  return { ordner: ziel, commit: execSync('git rev-parse HEAD', { cwd: ziel }).toString().trim() };
}

function appFinden(klon) {
  if (existsSync(join(klon, 'index.html'))) return '.';
  // Monorepos: der Teil mit der Oberflaeche, bevorzugt nach ueblichen Namen.
  const kandidaten = [];
  for (const gruppe of ['packages', 'apps', '.']) {
    const g = join(klon, gruppe);
    if (!existsSync(g)) continue;
    for (const e of readdirSync(g, { withFileTypes: true })) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && existsSync(join(g, e.name, 'index.html'))) kandidaten.push(join(gruppe, e.name).replaceAll('\\', '/'));
    }
  }
  const rang = (p) => { const i = ['client', 'web', 'app', 'game', 'frontend'].indexOf(p.split('/').pop()); return i < 0 ? 99 : i; };
  return kandidaten.sort((a, b) => rang(a) - rang(b))[0] || null;
}

function paketManager(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return { name: 'pnpm', installieren: ['pnpm install --frozen-lockfile', 'pnpm install --no-frozen-lockfile'] };
  if (existsSync(join(dir, 'yarn.lock'))) return { name: 'yarn', installieren: ['npx --yes yarn@1 install --frozen-lockfile', 'npx --yes yarn@1 install'] };
  if (existsSync(join(dir, 'package-lock.json'))) return { name: 'npm', installieren: ['npm ci', 'npm install'] };
  return { name: 'npm', installieren: ['npm install'] };
}

const hatVite = (pkg) => !!(pkg && ({ ...pkg.dependencies, ...pkg.devDependencies }).vite);
// Das Spiel laeuft unter /games/<id>/. Wer mit "/assets/..." oder "/Repo/..."
// verweist, sucht seine Dateien an der falschen Stelle.
const absolutePfade = (html) => /(?:src|href)=["']\/(?!\/)[^"']+\.(?:js|mjs|css)["']/.test(html);

// Liefert den Ordner mit dem fertigen Spiel.
function bauen(klon, einstellungen) {
  const e = einstellungen;
  if (e.fertig) {
    const fertig = join(klon, e.fertig);
    if (!existsSync(join(fertig, 'index.html'))) throw new Error(`fertiger Build ${e.fertig} hat keine index.html`);
    return fertig;
  }
  if (existsSync(join(klon, 'ProjectSettings/ProjectVersion.txt'))) throw new Error('Unity-Projekt: WebGL-Build geht nicht ohne Unity-Lizenz; einen fertigen Build einchecken und in miwale.json unter "fertig" angeben');
  const godot = ['.', ...readdirSync(klon, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name)].find((d) => existsSync(join(klon, d, 'project.godot')));
  if (godot !== undefined) throw new Error('Godot-Projekt: Web-Export noch nicht automatisch; einen fertigen Export einchecken und in miwale.json unter "fertig" angeben');

  const app = e.app || appFinden(klon);
  if (!app) throw new Error('kein Web-Einstieg (keine index.html gefunden)');
  const appOrdner = join(klon, app);
  const wurzelPkg = lesenJson(join(klon, 'package.json'));
  const appPkg = lesenJson(join(appOrdner, 'package.json')) || wurzelPkg;

  // Ohne package.json: fertige Webseite, so wie sie im Repository liegt.
  if (!wurzelPkg && !appPkg) return appOrdner;

  const pkgOrdner = wurzelPkg ? klon : appOrdner;
  const pm = paketManager(pkgOrdner);
  versuchen(pm.installieren, pkgOrdner);

  const ausgabe = join(klon, e.dist || join(app, 'dist'));
  if (e.build) aufrufen(e.build, klon);
  else if (wurzelPkg?.scripts?.build) aufrufen(`${pm.name} run build`, klon);
  else if (appPkg?.scripts?.build) aufrufen(`${pm.name} run build`, appOrdner);
  else if (hatVite(appPkg) || hatVite(wurzelPkg)) aufrufen(`npx vite build --base ./ --outDir "${ausgabe}" --emptyOutDir`, appOrdner);
  else return appOrdner; // package.json nur fuer Werkzeuge, das Spiel selbst ist statisch

  if (!existsSync(join(ausgabe, 'index.html')) || absolutePfade(readFileSync(join(ausgabe, 'index.html'), 'utf8'))) {
    if (!hatVite(appPkg) && !hatVite(wurzelPkg)) throw new Error(`Build liefert keine brauchbare ${relative(klon, ausgabe)}/index.html`);
    // Vite mit fester Basis (z. B. fuer GitHub Pages): relativ nachbauen.
    aufrufen(`npx vite build --base ./ --outDir "${ausgabe}" --emptyOutDir`, appOrdner);
  }
  if (!existsSync(join(ausgabe, 'index.html'))) throw new Error('Build liefert keine index.html');
  return ausgabe;
}

// ---- Texte fuer neue Spiele -------------------------------------------------------
function readmeAbsatz(klon) {
  const datei = readdirSync(klon).find((f) => /^readme\.md$/i.test(f));
  if (!datei) return '';
  const md = readFileSync(join(klon, datei), 'utf8').replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const block of md.split(/\r?\n\s*\r?\n/)) {
    const t = block.trim();
    if (!t || /^(#|!\[|\[!\[|<|\||>|[-*+] |\d+\. |---)/.test(t)) continue;
    const satz = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
    if (satz.length < 40) continue;
    if (satz.length <= 320) return satz;
    const kurz = satz.slice(0, 320);
    return kurz.slice(0, Math.max(kurz.lastIndexOf('. ') + 1, 200)).trim();
  }
  return '';
}

function autoEintrag({ id, repo, klon, mj, pruefung }) {
  const text = (l) => mj.texte?.[l] || {};
  const beschreibung = repo.description?.trim() || readmeAbsatz(klon);
  const ersatz = { en: 'A game by miwale – playable right in your browser.', de: 'Ein Spiel von miwale – direkt im Browser spielbar.' };
  const themen = (repo.topics || []).filter((x) => !['game', 'games', 'miwale'].includes(x)).map((x) => x.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()));
  const sprache = (l) => {
    const kurz = text(l).kurz || beschreibung || ersatz[l];
    return {
      kurz,
      tags: text(l).tags || (themen.length ? themen : [l === 'de' ? 'Prototyp' : 'Prototype']),
      ueber: text(l).ueber || [kurz],
      features: text(l).features || [],
      steuerung: text(l).steuerung || ''
    };
  };
  const bild = (i) => `assets/games/auto/${id}-${i}.jpg`;
  const erstellt = repo.created_at.slice(0, 10);
  return {
    id,
    name: mj.name || repo.name.replace(/[-_]+/g, ' '),
    auto: true,
    veroeffentlicht: mj.veroeffentlicht || erstellt,
    geraete: mj.geraete || (pruefung.handy ? ['pc', 'handy'] : ['pc']),
    status: mj.status || { en: 'Playable prototype', de: 'Spielbarer Prototyp' },
    spielen: `/games/${id}/index.html`,
    bild: bild(1),
    bilder: [bild(1), bild(0)],
    quelle: repo.html_url,
    texte: { en: sprache('en'), de: sprache('de') }
  };
}

// "Neu" gilt die ersten Wochen nach dem Anlegen des Repositorys; bei jedem Lauf
// neu berechnet, damit es auch bei unveraenderten Spielen wieder verschwindet.
function autoKatalogSchreiben(liste) {
  const eintraege = liste.map(({ neu, ...s }) => {
    const frisch = Date.now() - Date.parse(s.veroeffentlicht) < NEU_TAGE * 864e5;
    const { id, name, auto, ...rest } = s;
    return frisch ? { id, name, auto, neu: true, ...rest } : s;
  });
  const kopf = `// AUTOMATISCH ERZEUGT von tools/sync-games.mjs – nicht von Hand bearbeiten.
//
// Spiele von GitHub, die die Kern-Pruefung bestanden haben und (noch) keinen
// handgeschriebenen Eintrag in shop/spiele.js haben. Bekommt ein Spiel dort
// einen Eintrag, gilt der und dieser hier wird uebersprungen.
// Texte kommen aus miwale.json im Spiel-Repository, sonst aus Beschreibung und README.
(function (auto) {
  const liste = window.MIWALE_SPIELE = window.MIWALE_SPIELE || [];
  const da = new Set(liste.map((s) => s.id));
  for (const s of auto) if (!da.has(s.id)) liste.push(s);
})(`;
  writeFileSync(AUTO_KATALOG, kopf + JSON.stringify(eintraege, null, 2) + ');\n');
}

// ---- Ablauf -----------------------------------------------------------------------
const kuratiert = new Map(katalogLesen(join(root, 'shop/spiele.js')).map((s) => [s.id, s]));
const selbstGehostet = (s) => s && s.spielen && s.spielen.startsWith(`/games/${s.id}/`);
const alt = lesenJson(MANIFEST) || {};
const alteAuto = new Map(katalogLesen(AUTO_KATALOG).map((s) => [s.id, s]));

const manifest = {};
const auto = new Map();
const bericht = [];
const melden = (repo, id, ergebnis, text = '') => { bericht.push({ repo, id, ergebnis, text }); console.log(`→ ${repo} (${id}): ${ergebnis}${text ? ' – ' + text : ''}`); };
// Von Hand gepflegte Spiele verschwinden nie von der Seite, auch nicht, wenn ihr
// Repository umbenannt oder privat wird.
for (const [id, eintrag] of Object.entries(alt)) if (selbstGehostet(kuratiert.get(id))) manifest[id] = eintrag;
const behalten = (id) => {
  if (alt[id] && existsSync(join(AUSGABE, id))) manifest[id] = alt[id];
  if (alteAuto.has(id)) auto.set(id, alteAuto.get(id));
};

mkdirSync(AUTO_BILDER, { recursive: true });
const repos = await repositories();
console.log(`${repos.length} oeffentliche Repositories bei ${QUELLEN.konto}.`);
const gesehen = new Set();

for (const repo of repos.sort((a, b) => a.name.localeCompare(b.name))) {
  const cfg = QUELLEN.repos[repo.name] || {};
  const id = cfg.id || kennung(repo.name);
  gesehen.add(id);
  if (QUELLEN.ausgeschlossen[repo.name]) { melden(repo.name, id, 'ausgeschlossen', QUELLEN.ausgeschlossen[repo.name]); continue; }
  if (nur.length && !nur.includes(id)) { behalten(id); continue; }
  const kur = kuratiert.get(id);
  if (kur && !selbstGehostet(kur)) { melden(repo.name, id, 'uebersprungen', `von Hand gepflegt, laeuft extern (${kur.spielen})`); continue; }

  // Die Kern-Pruefung sieht, ob etwas laedt und reagiert, aber nicht, ob es ein
  // Spiel ist. Neue Repositories melden sich darum selbst an: Topic oder
  // miwale.json. Vor dem Klonen fragen, sonst holte jeder Lauf alles.
  if (!kur && !cfg.id && !(repo.topics || []).includes(FREIGABE_TOPIC) && (await api(`/repos/${repo.full_name}/contents/miwale.json`)).status !== 200) {
    melden(repo.name, id, 'nicht markiert', `zum Aufnehmen Topic "${FREIGABE_TOPIC}" setzen oder miwale.json anlegen`);
    continue;
  }

  console.log(`\n=== ${repo.name} (${id})`);
  try {
    const { ordner: klon, commit } = klonen(repo);
    const mj = lesenJson(join(klon, 'miwale.json')) || {};
    if (mj.aufnehmen === false) { melden(repo.name, id, 'ausgeschlossen', 'miwale.json: "aufnehmen": false'); continue; }
    if (!alleNeu && alt[id]?.commit === commit && existsSync(join(AUSGABE, id)) && (kur || alteAuto.has(id))) {
      behalten(id);
      melden(repo.name, id, 'unveraendert', commit.slice(0, 7));
      continue;
    }

    const fertig = bauen(klon, { ...mj, ...cfg });
    const bau = join(BAU, id);
    rmSync(bau, { recursive: true, force: true });
    mkdirSync(BAU, { recursive: true });
    cpSync(fertig, bau, { recursive: true, filter: (f) => { const n = f.split(/[\\/]/).pop(); return !f.endsWith('.map') && n !== 'node_modules' && (f === fertig || !n.startsWith('.')); } });
    const mb = groesse(bau) / 1e6;
    if (mb > HOECHSTENS_MB) throw new Error(`zu gross: ${mb.toFixed(0)} MB (hoechstens ${HOECHSTENS_MB})`);

    const pruefung = await kernPruefen({ ordner: bau, id, bilder: kur ? null : join(AUTO_BILDER, id) });
    if (!pruefung.ok) {
      behalten(id);
      melden(repo.name, id, 'durchgefallen', pruefung.gruende.join('; ') + (alt[id] ? ' (alte Fassung bleibt)' : ''));
      continue;
    }
    const ziel = spielOrdner(id);
    rmSync(ziel, { recursive: true, force: true });
    renameSync(bau, ziel);
    manifest[id] = { path: `games/${id}/`, sha256: pruefsumme(ziel), repo: repo.full_name, commit, handy: pruefung.handy };
    if (!kur) auto.set(id, autoEintrag({ id, repo, klon, mj, pruefung }));
    melden(repo.name, id, alt[id] ? 'aktualisiert' : 'aufgenommen', `${commit.slice(0, 7)}, ${mb.toFixed(1)} MB${pruefung.handy ? ', auch am Handy' : ', nur PC: ' + pruefung.handyGruende.join('; ')}`);
  } catch (e) {
    behalten(id);
    melden(repo.name, id, 'fehler', String(e.message || e).split('\n')[0].slice(0, 300) + (alt[id] ? ' (alte Fassung bleibt)' : ''));
  }
}
// Bei "nur": was nicht dran war und nicht mehr auf GitHub steht, trotzdem halten.
if (nur.length) for (const id of Object.keys(alt)) if (!gesehen.has(id)) behalten(id);

// ---- Schreiben und aufraeumen -----------------------------------------------------
const reihenfolge = [...kuratiert.keys()].filter((id) => manifest[id]).concat(Object.keys(manifest).filter((id) => !kuratiert.has(id)).sort());
writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(reihenfolge.map((id) => [id, manifest[id]])), null, 2) + '\n');
autoKatalogSchreiben([...auto.values()].filter((s) => manifest[s.id]).sort((a, b) => b.veroeffentlicht.localeCompare(a.veroeffentlicht) || a.id.localeCompare(b.id)));
for (const e of readdirSync(AUSGABE, { withFileTypes: true })) {
  if (e.isDirectory() && !manifest[e.name]) { rmSync(spielOrdner(e.name), { recursive: true, force: true }); console.log(`entfernt: public/games/${e.name}`); }
}
for (const f of readdirSync(AUTO_BILDER)) {
  const id = f.replace(/-\d+\.jpg$/, '');
  if (!auto.has(id) || !manifest[id]) rmSync(join(AUTO_BILDER, f));
}
rmSync(BAU, { recursive: true, force: true });

const zeilen = ['| Repository | id | Ergebnis | Details |', '| --- | --- | --- | --- |',
  ...bericht.map((b) => `| ${b.repo} | ${b.id} | ${b.ergebnis} | ${b.text.replaceAll('|', '/')} |`)];
const md = `## Spiele von GitHub\n\n${Object.keys(manifest).length} Spiele auf miwale.com, davon ${[...auto.keys()].filter((id) => manifest[id]).length} automatisch aufgenommen.\n\n${zeilen.join('\n')}\n`;
writeFileSync(join(CACHE, 'bericht.md'), md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log('\n' + md);
