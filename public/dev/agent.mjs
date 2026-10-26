// miwale Dev-Zentrale: der Agent. Laeuft auf jedem eigenen Windows-Rechner,
// lauscht nur auf 127.0.0.1:5300 und beantwortet die Seite miwale.com/dev.
// Die Seite kennt keine Geraete: Sie fragt im Browser "localhost", und das ist
// immer der Rechner, an dem man gerade sitzt.
//
// Was er kann: laufende Dev-Server zeigen und beenden, Projekte auf den
// Laufwerken finden und mit ihrem dev-Skript starten. Mehr nicht -- die Seite
// kann nur "starte Projekt X" sagen; welcher Befehl dahintersteht, bestimmt
// allein der Agent aus der package.json. Beenden darf er nur Prozesse, die er
// selbst als Dev-Server auflistet.
//
// Installieren: public/dev/installieren.ps1 (legt ihn nach
// %LOCALAPPDATA%\miwale-dev und in den Autostart). Keine Abhaengigkeiten.
//
//   node agent.mjs             startet den Dienst im Hintergrund, falls er nicht laeuft
//   node agent.mjs --oeffnen   dazu die Seite im Browser oeffnen
//   node agent.mjs --seite=URL welche Seite --oeffnen oeffnet (wird gemerkt)

import http from 'node:http';
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const VERSION = 3;
export const PORT = 5300;
const DATEN = path.join(process.env.LOCALAPPDATA || os.homedir(), 'miwale-dev');
const EINSTELLUNGEN = path.join(DATEN, 'einstellungen.json');
const PROJEKTE_CACHE = path.join(DATEN, 'projekte.json');
const LOGS = path.join(DATEN, 'logs');
const STANDARD_SEITE = 'https://miwale.com/dev/';

// ---------------------------------------------------------------------------
// Reine Hilfsfunktionen (tools/dev-zentrale.test.mjs)

// Nur diese Seiten duerfen den Agenten ansprechen. localhost: der eigene
// Vite-Server (pnpm dev) -- was dort laeuft, laeuft ohnehin schon auf dem Rechner.
export function erlaubterUrsprung(ursprung) {
  if (!ursprung) return false;
  if (ursprung === 'https://miwale.com' || ursprung === 'https://www.miwale.com') return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(ursprung);
}

// Schutz gegen DNS-Rebinding: eine fremde Domain, die auf 127.0.0.1 zeigt,
// schickte ihren eigenen Namen im Host-Kopf.
export function erlaubterHost(host) {
  return host === `127.0.0.1:${PORT}` || host === `localhost:${PORT}`;
}

const SKRIPTE = ['dev', 'start', 'serve', 'develop'];
const MANAGER = ['pnpm', 'yarn', 'npm', 'bun'];

// Aus package.json und den Dateinamen im Ordner: welches Skript, welcher
// Paketmanager. null, wenn es nichts zu starten gibt.
export function projektAusPaket(paket, namen) {
  const skripte = paket && typeof paket.scripts === 'object' && paket.scripts ? paket.scripts : {};
  const skript = SKRIPTE.find((s) => typeof skripte[s] === 'string' && skripte[s].trim());
  if (!skript) return null;
  const [angabe, version] = typeof paket.packageManager === 'string' ? paket.packageManager.split('+')[0].split('@') : [];
  let pm = MANAGER.includes(angabe) ? angabe : '';
  if (!pm) {
    pm = namen.has('pnpm-lock.yaml') ? 'pnpm'
      : namen.has('yarn.lock') ? 'yarn'
      : namen.has('bun.lockb') || namen.has('bun.lock') ? 'bun'
      : 'npm';
  }
  const abh = { ...(paket.dependencies || {}), ...(paket.devDependencies || {}) };
  const installiert = namen.has('node_modules') || Object.keys(abh).length === 0;
  return { skript, pm, pmVersion: pm === angabe && /^[\w.-]+$/.test(version || '') ? version : '', installiert, befehlText: skripte[skript].slice(0, 160) };
}

// Welche Pakete aus package.json Node nicht findet -- gesucht wie Node selbst,
// vom Projekt aufwaerts (Workspaces legen sie oft im Elternordner ab). Ein
// node_modules-Ordner allein heisst nichts: Nach dem Verschieben eines
// Projekts zeigen pnpms Verknuepfungen noch auf den alten Ort ins Leere.
export function fehlendePakete(ordner, paket, existiert = fs.existsSync) {
  const namen = Object.keys({ ...(paket.dependencies || {}), ...(paket.devDependencies || {}) });
  return namen.filter((name) => {
    for (let o = ordner; ; o = path.dirname(o)) {
      if (existiert(path.join(o, 'node_modules', name, 'package.json'))) return false;
      if (path.dirname(o) === o) return true;
    }
  });
}

// Fehlt der Paketmanager auf diesem Rechner (pnpm auf einem frischen
// Laptop), holt npx ihn -- npm kommt immer mit Node.
// ausfuehren: mit den pnpm-Optionen, die der Agent wirklich braucht (die
// Anzeige auf der Seite bleibt ohne). Ohne Konsole bricht pnpm sonst ab: an
// der Rueckfrage, ob ein node_modules von einem anderen Ort ersetzt werden
// darf (verschobenes Projekt), an nicht freigegebenen Build-Skripten, und vor
// "run" an seiner eigenen Pruefung der Abhaengigkeiten. Als Optionen, nicht
// als Umgebungsvariablen: confirmModulesPurge liest pnpm 11 nur so.
export function befehle(p, pmVorhanden = true, ausfuehren = false) {
  const aufruf = pmVorhanden || p.pm === 'npm' ? p.pm : `npx -y ${p.pm}${p.pmVersion ? `@${p.pmVersion}` : ''}`;
  const pnpm = ausfuehren && p.pm === 'pnpm';
  return {
    install: `${aufruf} install${pnpm ? ' --config.confirm-modules-purge=false --config.strict-dep-builds=false' : ''}`,
    lauf: p.pm === 'yarn' ? `${aufruf} ${p.skript}` : `${aufruf}${pnpm ? ' --config.verify-deps-before-run=false' : ''} run ${p.skript}`,
  };
}

export function startBefehl(p, pmVorhanden = true) {
  const { install, lauf } = befehle(p, pmVorhanden);
  return p.installiert ? lauf : `${install} && ${lauf}`;
}

// Startfehler, gegen die Neuinstallieren nichts hilft.
export function portBelegt(text) {
  const m = /port\s+(\d{2,5})\s+is\s+(?:already\s+)?in use|EADDRINUSE[^\n]*?:(\d{2,5})/i.exec(text);
  return m ? Number(m[1] || m[2]) : 0;
}

// Der feste Port, den ein Projekt selbst vorgibt: --port im dev-Skript oder
// vite.config. 0, wenn es keinen vorgibt.
export function portAusProjekt(paket, konfigText = '') {
  const skript = paket?.scripts?.dev || paket?.scripts?.start || '';
  const m = /(?:--port|-p)[= ](\d{2,5})\b/.exec(skript) || /\bport\s*:\s*(\d{2,5})\b/.exec(konfigText);
  return m ? Number(m[1]) : 0;
}

function leseKonfig(ordner) {
  for (const n of ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts']) {
    try { return fs.readFileSync(path.join(ordner, n), 'utf8').slice(0, 20000); } catch { /* naechste */ }
  }
  return '';
}

export function projektId(ordner) {
  return crypto.createHash('sha1').update(ordner.toLowerCase()).digest('hex').slice(0, 10);
}

// Gleichnamige Ordner (zweimal "tools") bekommen den Elternordner dazu,
// nichtssagende ("src", "app") stellen ihn voran: "mathequiz/src".
const NICHTSSAGEND = new Set(['src', 'app', 'web', 'www', 'site', 'client', 'frontend', 'backend', 'server', 'ui', 'game', 'public']);

export function vergibNamen(projekte) {
  const zahl = new Map();
  for (const p of projekte) {
    const n = path.win32.basename(p.ordner).toLowerCase();
    zahl.set(n, (zahl.get(n) || 0) + 1);
  }
  for (const p of projekte) {
    const n = path.win32.basename(p.ordner);
    const eltern = path.win32.basename(path.win32.dirname(p.ordner));
    if (NICHTSSAGEND.has(n.toLowerCase()) && eltern) p.name = `${eltern}/${n}`;
    else p.name = zahl.get(n.toLowerCase()) > 1 ? `${n} (${eltern})` : n;
  }
  return projekte;
}

// netstat -ano. Lauschende TCP-Ports erkennt man an der Gegenstelle :0 --
// die Spalte "Status" ist auf deutschem Windows "ABHOEREN", nicht "LISTENING".
export function leseNetstat(text) {
  const liste = [];
  const gesehen = new Set();
  for (const zeile of text.split(/\r?\n/)) {
    const t = zeile.trim().split(/\s+/);
    if (t[0] !== 'TCP' || t.length < 5) continue;
    if (!/^(0\.0\.0\.0|\[::\]):0$/.test(t[2])) continue;
    const i = t[1].lastIndexOf(':');
    const port = Number(t[1].slice(i + 1));
    const pid = Number(t[t.length - 1]);
    if (!port || !pid) continue;
    const schluessel = `${pid}:${port}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    liste.push({ adresse: t[1].slice(0, i).replace(/^\[|\]$/g, ''), port, pid });
  }
  return liste;
}

// Aus dem Ende eines Logs die Zeilen, die den Fehler nennen -- ohne
// Stacktrace ("    at ...") und ohne die Kopfzeilen des Agenten.
export function fehlerAusLog(text) {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter((z) => z && !/^at\s/.test(z) && !z.startsWith('> '));
  const treffer = zeilen.filter((z) => /err|fehler|failed|not found|nicht gefunden|cannot|EADDRINUSE|already in use/i.test(z));
  return (treffer.length ? treffer : zeilen).slice(0, 3).join('\n');
}

// Programme, die typischerweise Dev-Server sind. Alles andere (Discord,
// Spotify, Editoren) taucht nur auf, wenn es zu einem Projekt gehoert.
const LAUFZEITEN = new Set(['node.exe', 'bun.exe', 'deno.exe', 'python.exe', 'pythonw.exe', 'php.exe', 'ruby.exe', 'java.exe', 'dotnet.exe', 'hugo.exe', 'caddy.exe']);

function befehlEnthaeltOrdner(befehl, ordner) {
  // Git Bash schreibt Laufwerke als /d/Projekte/...: erst zu d:/Projekte/... machen.
  const b = befehl.toLowerCase().replace(/(^|[\s"'=(])\/([a-z])\//g, '$1$2:/').replace(/\//g, '\\').replace(/\\\\+/g, '\\');
  const o = ordner.toLowerCase().replace(/\//g, '\\').replace(/\\+$/, '');
  return b.includes(o + '\\') || b.endsWith(o) || b.includes(o + '"');
}

// Zu welchem Projekt gehoert ein Prozess? Zuerst: hat der Agent ihn (oder
// einen Vorfahren) gestartet. Sonst: steht der Projektordner in seiner
// Befehlszeile oder der eines Vorfahren -- der laengste Treffer gewinnt, damit
// verschachtelte Projekte nicht beim aeusseren landen.
export function zuordnen(pid, prozesse, projekte, gestartet = new Map()) {
  let aktuell = prozesse.get(pid);
  for (let stufe = 0; aktuell && stufe < 8; stufe++) {
    for (const [id, eintrag] of gestartet) if (eintrag.pid === aktuell.pid) return id;
    let bester = null;
    if (aktuell.befehl) {
      for (const p of projekte) {
        if (befehlEnthaeltOrdner(aktuell.befehl, p.ordner) && (!bester || p.ordner.length > bester.ordner.length)) bester = p;
      }
    }
    if (bester) return bester.id;
    aktuell = prozesse.get(aktuell.eltern);
  }
  return null;
}

function vomAgent(pid, prozesse, gestartet) {
  const pids = new Set([...gestartet.values()].map((g) => g.pid));
  let aktuell = prozesse.get(pid);
  for (let stufe = 0; aktuell && stufe < 8; stufe++) {
    if (pids.has(aktuell.pid)) return true;
    aktuell = prozesse.get(aktuell.eltern);
  }
  return false;
}

// pnpm dev startet cmd.exe, das node mit pnpm, das cmd.exe, das node mit vite.
// Beendet wird ab dem obersten Glied, das noch zu dieser Kette gehoert -- aber
// nie das Terminal, aus dem jemand pnpm dev getippt hat.
function gehoertZurKette(p) {
  const name = (p.name || '').toLowerCase();
  const befehl = (p.befehl || '').toLowerCase();
  if (name === 'cmd.exe') return /\/d \/s \/c/.test(befehl);
  if (LAUFZEITEN.has(name)) return /pnpm|npm-cli|npx-cli|yarn|corepack|\bbun\b|\.bin[\\/]/.test(befehl);
  return false;
}

export function stoppWurzel(pid, prozesse) {
  let wurzel = prozesse.get(pid);
  if (!wurzel) return pid;
  for (let stufe = 0; stufe < 6; stufe++) {
    const eltern = prozesse.get(wurzel.eltern);
    if (!eltern || !gehoertZurKette(eltern)) break;
    wurzel = eltern;
  }
  return wurzel.pid;
}

// Aus Ports und Prozessen die Liste der Dev-Server: ein Eintrag je Prozess.
export function baueServer(hoeren, prozesse, projekte, gestartet, eigenePid) {
  const jePid = new Map();
  for (const h of hoeren) {
    if (h.pid === eigenePid) continue;
    const p = prozesse.get(h.pid);
    if (!p) continue;
    // Andere Programme (ein Browser mit dem Projektpfad in der Befehlszeile)
    // nur, wenn der Agent sie selbst gestartet hat.
    if (!LAUFZEITEN.has((p.name || '').toLowerCase()) && !vomAgent(h.pid, prozesse, gestartet)) continue;
    let projekt = zuordnen(h.pid, prozesse, projekte, gestartet);
    // Steht der Ordner nirgends in der Befehlskette (Vite per relativem Pfad
    // gestartet), gilt der Port aus der Projektkonfiguration: Gehoert er genau
    // einem Projekt, laeuft dort dessen Server.
    if (!projekt) {
      const eigene = projekte.filter((x) => x.port === h.port);
      if (eigene.length === 1) projekt = eigene[0].id;
    }
    let s = jePid.get(h.pid);
    if (!s) {
      s = { pid: h.pid, name: p.name, projekt, seit: p.seit, befehl: (p.befehl || '').slice(0, 240), ports: [], adressen: [] };
      jePid.set(h.pid, s);
    }
    if (!s.ports.includes(h.port)) { s.ports.push(h.port); s.adressen.push(h.adresse); }
  }
  const liste = [...jePid.values()];
  for (const s of liste) s.ports.sort((a, b) => a - b);
  return liste.sort((a, b) => a.ports[0] - b.ports[0]);
}

// ---------------------------------------------------------------------------
// Einstellungen

function leseJson(datei, ersatz) {
  try { return JSON.parse(fs.readFileSync(datei, 'utf8')); } catch { return ersatz; }
}

function schreibeJson(datei, wert) {
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, JSON.stringify(wert, null, 2));
}

function ladeEinstellungen() {
  const e = leseJson(EINSTELLUNGEN, {});
  return {
    seite: typeof e.seite === 'string' ? e.seite : STANDARD_SEITE,
    // Zusaetzliche Ordner, falls Projekte ausserhalb der ueblichen Orte liegen.
    ordner: Array.isArray(e.ordner) ? e.ordner.filter((o) => typeof o === 'string') : [],
    ausblenden: Array.isArray(e.ausblenden) ? e.ausblenden.filter((o) => typeof o === 'string') : [],
  };
}

function protokoll(...teile) {
  try {
    fs.mkdirSync(DATEN, { recursive: true });
    const datei = path.join(DATEN, 'agent.log');
    if (fs.existsSync(datei) && fs.statSync(datei).size > 512 * 1024) fs.renameSync(datei, datei + '.alt');
    fs.appendFileSync(datei, `${new Date().toISOString()} ${teile.join(' ')}\n`);
  } catch { /* Protokoll ist Beiwerk */ }
}

// ---------------------------------------------------------------------------
// Projekte finden: alle Laufwerke, Ordner mit package.json und dev-Skript.

const UEBERSPRINGEN = new Set([
  'node_modules', 'dist', 'build', 'out', 'library', 'temp', 'tmp', 'obj', 'bin', 'logs', 'coverage', 'vendor',
  'appdata', 'anwendungsdaten', 'lokale einstellungen', 'windows', 'program files', 'program files (x86)',
  'programdata', 'recovery', 'perflogs', 'msocache', 'system volume information', 'intel', 'amd', 'nvidia',
  'drivers', 'users', 'benutzer', 'steamlibrary', 'steam', 'epic games', 'riot games', 'xboxgames',
  'windowsapps', 'onedrivetemp', '__pycache__', 'venv', 'site-packages', 'packages', 'pods',
]);

const MAX_ORDNER = 60000;

async function sucheIn(ordner, tiefe, funde, zaehler) {
  if (zaehler.n++ > MAX_ORDNER) return;
  let eintraege;
  try { eintraege = await fsp.readdir(ordner, { withFileTypes: true }); } catch { return; }
  const namen = new Set(eintraege.map((e) => e.name));
  if (namen.has('package.json')) {
    const paket = leseJson(path.join(ordner, 'package.json'), null);
    const info = paket && projektAusPaket(paket, namen);
    if (info) {
      if (info.installiert) info.installiert = fehlendePakete(ordner, paket).length === 0;
      funde.push({ id: projektId(ordner), ordner, ...info, port: portAusProjekt(paket, leseKonfig(ordner)), aktiv: await letzteAenderung(ordner) });
      return;
    }
  }
  // Unity-Projekte: riesig, und darin liegt nichts zum Starten.
  if (namen.has('ProjectSettings') && namen.has('Assets')) return;
  if (tiefe <= 0) return;
  await Promise.all(eintraege
    .filter((e) => e.isDirectory() && !/^[.$~]/.test(e.name) && !UEBERSPRINGEN.has(e.name.toLowerCase()))
    .map((e) => sucheIn(path.join(ordner, e.name), tiefe - 1, funde, zaehler)));
}

// Woran zuletzt gearbeitet wurde: .git/index aendert sich bei jedem Commit
// und jedem git add, der Ordner selbst bei neuen Dateien.
async function letzteAenderung(ordner) {
  let zeit = 0;
  for (const datei of [path.join(ordner, '.git', 'index'), path.join(ordner, 'package.json'), ordner]) {
    try { zeit = Math.max(zeit, (await fsp.stat(datei)).mtimeMs); } catch { /* fehlt */ }
  }
  return Math.round(zeit);
}

async function wurzeln(einstellungen) {
  const liste = [{ ordner: os.homedir(), tiefe: 5 }];
  for (const buchstabe of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
    const laufwerk = `${buchstabe}:\\`;
    try { await fsp.access(laufwerk); } catch { continue; }
    // Auf C: liegt das Benutzerverzeichnis schon oben; dort nur flacher suchen.
    liste.push({ ordner: laufwerk, tiefe: buchstabe === 'C' ? 3 : 5 });
  }
  for (const o of einstellungen.ordner) liste.push({ ordner: o, tiefe: 6 });
  return liste;
}

export async function sucheProjekte(einstellungen) {
  const funde = [];
  const zaehler = { n: 0 };
  for (const w of await wurzeln(einstellungen)) await sucheIn(w.ordner, w.tiefe, funde, zaehler);
  const eindeutig = new Map();
  for (const p of funde) eindeutig.set(p.id, p);
  return vergibNamen([...eindeutig.values()]).sort((a, b) => b.aktiv - a.aktiv);
}

// ---------------------------------------------------------------------------
// Prozesse: eine dauerhaft offene PowerShell. Jeder Neustart von PowerShell
// kostet gut eine Sekunde; die offene antwortet in etwa 0,2 s.

const MARKE = '<<miwale-ende>>';
const PROZESSE_BEFEHL = "$p = Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,CommandLine,CreationDate | ForEach-Object { @{i=$_.ProcessId;e=$_.ParentProcessId;n=$_.Name;c=$_.CommandLine;s=$(if ($_.CreationDate) { $_.CreationDate.ToString('o') } else { $null })} }; [Console]::Out.WriteLine((ConvertTo-Json -InputObject @($p) -Compress))";

class PowerShell {
  constructor() { this.kind = null; this.kette = Promise.resolve(); this.leerlauf = null; }

  starte() {
    this.kind = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-'], { windowsHide: true });
    this.kind.stdout.setEncoding('utf8');
    this.puffer = '';
    this.kind.stdout.on('data', (d) => { this.puffer += d; this.pruefe(); });
    this.kind.stderr.on('data', () => {});
    this.kind.on('exit', () => {
      this.kind = null;
      if (this.wartend) { this.wartend.reject(new Error('PowerShell beendet')); this.wartend = null; }
    });
    this.kind.stdin.write('[Console]::OutputEncoding = [Text.Encoding]::UTF8; $ProgressPreference = "SilentlyContinue"\n');
  }

  pruefe() {
    const i = this.puffer.indexOf(MARKE);
    if (i < 0 || !this.wartend) return;
    const text = this.puffer.slice(0, i);
    this.puffer = this.puffer.slice(i + MARKE.length);
    clearTimeout(this.wartend.timer);
    this.wartend.resolve(text);
    this.wartend = null;
  }

  frage(befehl) {
    const lauf = this.kette.then(() => new Promise((resolve, reject) => {
      if (!this.kind) this.starte();
      clearTimeout(this.leerlauf);
      this.puffer = '';
      const timer = setTimeout(() => {
        this.wartend = null;
        this.kind?.kill();
        reject(new Error('PowerShell antwortet nicht'));
      }, 15000);
      this.wartend = { resolve, reject, timer };
      this.kind.stdin.write(`${befehl}; [Console]::Out.WriteLine('${MARKE}')\n`);
    }));
    this.kette = lauf.catch(() => {}).then(() => {
      // Nach zehn Minuten ohne Anfrage zumachen; die Seite ist dann zu.
      clearTimeout(this.leerlauf);
      this.leerlauf = setTimeout(() => this.kind?.kill(), 10 * 60 * 1000);
      this.leerlauf.unref();
    });
    return lauf;
  }
}

function fuehreAus(datei, argumente) {
  return new Promise((resolve) => {
    execFile(datei, argumente, { windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (fehler, stdout) => resolve(fehler && !stdout ? '' : String(stdout)));
  });
}

function oeffneAdresse(adresse) {
  spawn('explorer.exe', [adresse], { windowsHide: true, detached: true, stdio: 'ignore' }).unref();
}

// ---------------------------------------------------------------------------
// Der Dienst

class Zentrale {
  constructor() {
    this.einstellungen = ladeEinstellungen();
    this.projekte = leseJson(PROJEKTE_CACHE, []);
    if (!Array.isArray(this.projekte)) this.projekte = [];
    this.suche = null;
    this.letzteSuche = 0;
    this.ps = new PowerShell();
    this.aufnahme = null;
    this.aufnahmeZeit = 0;
    this.aufnahmeLaeuft = null;
    // id -> { pid, seit, oeffnen, zustand: 'startet'|'laeuft'|'fehler', fehler }
    this.gestartet = new Map();
    this.beobachter = null;
  }

  sichtbareProjekte() {
    const aus = new Set(this.einstellungen.ausblenden.map((o) => o.toLowerCase()));
    return this.projekte.filter((p) => !aus.has(p.ordner.toLowerCase()));
  }

  neuSuchen() {
    if (this.suche) return this.suche;
    this.suche = sucheProjekte(this.einstellungen)
      .then((projekte) => {
        this.projekte = projekte;
        this.letzteSuche = Date.now();
        schreibeJson(PROJEKTE_CACHE, projekte);
      })
      .catch((f) => protokoll('Suche fehlgeschlagen:', f.message))
      .finally(() => { this.suche = null; });
    return this.suche;
  }

  async momentaufnahme(frisch = false) {
    if (!frisch && this.aufnahme && Date.now() - this.aufnahmeZeit < 1200) return this.aufnahme;
    if (this.aufnahmeLaeuft) return this.aufnahmeLaeuft;
    this.aufnahmeLaeuft = (async () => {
      const [netstat, json] = await Promise.all([fuehreAus('netstat', ['-ano']), this.ps.frage(PROZESSE_BEFEHL)]);
      const prozesse = new Map();
      for (const p of JSON.parse(json.trim() || '[]')) prozesse.set(p.i, { pid: p.i, eltern: p.e, name: p.n, befehl: p.c || '', seit: p.s });
      const hoeren = leseNetstat(netstat);
      this.aufnahme = { prozesse, hoeren };
      this.aufnahmeZeit = Date.now();
      return this.aufnahme;
    })().finally(() => { this.aufnahmeLaeuft = null; });
    return this.aufnahmeLaeuft;
  }

  async stand() {
    if (!this.projekte.length && !this.letzteSuche) this.neuSuchen();
    else if (Date.now() - this.letzteSuche > 5 * 60 * 1000) this.neuSuchen();
    const { prozesse, hoeren } = await this.momentaufnahme();
    this.abgleichen(prozesse);
    const server = baueServer(hoeren, prozesse, this.projekte, this.gestartet, process.pid);
    const projekte = this.sichtbareProjekte().map((p) => {
      const eigene = server.filter((s) => s.projekt === p.id);
      const start = this.gestartet.get(p.id);
      let zustand = eigene.length ? 'laeuft' : start ? start.zustand : 'aus';
      if (zustand === 'laeuft' && !eigene.length && start && !prozesse.has(start.pid)) zustand = 'aus';
      return {
        id: p.id, name: p.name, ordner: p.ordner, skript: p.skript, pm: p.pm, installiert: p.installiert,
        befehl: startBefehl(p), aktiv: p.aktiv, zustand, ports: eigene.flatMap((s) => s.ports).sort((a, b) => a - b),
        seit: eigene[0]?.seit || (start ? new Date(start.seit).toISOString() : null), fehler: start?.fehler || null,
        installiertGerade: Boolean(start?.installieren && start.zustand === 'startet'), repariert: Boolean(start?.reparieren && start.zustand === 'startet'),
      };
    });
    return {
      version: VERSION,
      rechner: os.hostname(),
      server,
      projekte,
      ausgeblendet: this.projekte.length - projekte.length,
      suche: { laeuft: Boolean(this.suche), zeit: this.letzteSuche || null },
    };
  }

  // Gestartete Prozesse nachhalten: Port da -> laeuft (und ggf. Browser auf),
  // Prozess weg -> vergessen, noch kein Port nach langer Zeit -> laeuft ohne Port.
  abgleichen(prozesse) {
    if (!this.aufnahme) return;
    const server = baueServer(this.aufnahme.hoeren, prozesse, this.projekte, this.gestartet, process.pid);
    for (const [id, s] of this.gestartet) {
      const eigene = server.filter((x) => x.projekt === id);
      if (s.zustand === 'startet' && eigene.length) {
        s.zustand = 'laeuft';
        if (s.oeffnen) oeffneAdresse(`http://localhost:${eigene[0].ports[0]}/`);
        s.oeffnen = false;
      } else if (s.zustand === 'startet' && Date.now() - s.seit > 5 * 60 * 1000 && prozesse.has(s.pid)) {
        s.zustand = 'laeuft';
      } else if (s.zustand === 'laeuft' && !eigene.length && !prozesse.has(s.pid)) {
        this.gestartet.delete(id);
      }
    }
  }

  beobachten() {
    if (this.beobachter) return;
    this.beobachter = setInterval(async () => {
      if (![...this.gestartet.values()].some((s) => s.zustand === 'startet')) {
        clearInterval(this.beobachter);
        this.beobachter = null;
        return;
      }
      try { const { prozesse } = await this.momentaufnahme(true); this.abgleichen(prozesse); } catch (f) { protokoll('Beobachten:', f.message); }
    }, 1500);
  }

  async pmVorhanden(pm) {
    this.pms ??= new Map();
    const bekannt = this.pms.get(pm);
    if (bekannt && Date.now() - bekannt.zeit < 10 * 60 * 1000) return bekannt.da;
    const da = pm === 'npm' || Boolean((await fuehreAus('where', [pm])).trim());
    this.pms.set(pm, { da, zeit: Date.now() });
    return da;
  }

  // reparieren: zweiter Versuch nach einem gescheiterten Start -- immer erst
  // installieren, und scheitert das, node_modules neu aufbauen (kindProzess).
  async starten(id, oeffnen, reparieren = false) {
    const projekt = this.projekte.find((p) => p.id === id);
    if (!projekt) return { status: 404, fehler: 'Projekt unbekannt' };
    const paket = leseJson(path.join(projekt.ordner, 'package.json'), null);
    if (!paket) return { status: 404, fehler: 'Ordner oder package.json nicht mehr da – „Neu suchen“' };
    const st = await this.stand();
    const jetzt = st.projekte.find((p) => p.id === id);
    if (jetzt?.ports.length) {
      if (oeffnen) oeffneAdresse(`http://localhost:${jetzt.ports[0]}/`);
      return { ok: true, port: jetzt.ports[0] };
    }
    if (this.gestartet.get(id)?.zustand === 'startet') return { ok: true };

    // Bei jedem Start frisch: Skript, Paketmanager, und ob wirklich alle Pakete da sind.
    let namen = new Set();
    try { namen = new Set(fs.readdirSync(projekt.ordner)); } catch { /* gleich unten egal */ }
    Object.assign(projekt, projektAusPaket(paket, namen) || {}, { port: portAusProjekt(paket, leseKonfig(projekt.ordner)) });
    const fehlend = fehlendePakete(projekt.ordner, paket);
    projekt.installiert = fehlend.length === 0;
    const { install, lauf } = befehle(projekt, await this.pmVorhanden(projekt.pm), true);
    const installieren = reparieren || fehlend.length > 0;

    fs.mkdirSync(LOGS, { recursive: true });
    const log = path.join(LOGS, `${id}.log`);
    const kopf = [`> in ${projekt.ordner}`];
    if (reparieren) kopf.push('> Reparatur: Der erste Start ist gescheitert, darum neu installieren.');
    else if (fehlend.length) kopf.push(`> Fehlende Pakete: ${fehlend.slice(0, 8).join(', ')}${fehlend.length > 8 ? ' …' : ''}`);
    fs.writeFileSync(log, `${kopf.join('\n')}\n`);
    // Ueber einen Zwischenprozess (kindProzess unten), losgeloest vom Agenten:
    // So laufen die Server weiter, wenn der Agent neu startet. Direkt mit
    // detached gestartet, verloere Vite seine Ausgabe ins Log.
    const auftrag = Buffer.from(JSON.stringify({ ordner: projekt.ordner, log, install: installieren ? install : '', lauf })).toString('base64url');
    const kind = spawn(process.execPath, [fileURLToPath(import.meta.url), '--kind', auftrag], { detached: true, windowsHide: true, stdio: 'ignore' });
    kind.unref();
    const eintrag = { pid: kind.pid, seit: Date.now(), oeffnen: Boolean(oeffnen), zustand: 'startet', fehler: null, installieren, reparieren };
    this.gestartet.set(id, eintrag);
    kind.on('exit', (code) => {
      if (this.gestartet.get(id) !== eintrag || eintrag.gestoppt) return;
      if (eintrag.zustand !== 'startet' && !code) return;
      const text = letzteZeilen(log, 80);
      const port = portBelegt(text);
      // Einmal selbst reparieren -- ausser der Port ist belegt, da hilft kein Installieren.
      if (eintrag.zustand === 'startet' && !reparieren && !port) {
        protokoll('Start gescheitert, repariere', projekt.ordner);
        this.gestartet.delete(id);
        this.starten(id, eintrag.oeffnen, true).catch((f) => protokoll('Reparatur:', f.message));
        return;
      }
      eintrag.zustand = 'fehler';
      if (port) {
        const wer = baueServer(this.aufnahme?.hoeren || [], this.aufnahme?.prozesse || new Map(), this.projekte, this.gestartet, process.pid)
          .find((s) => s.ports.includes(port));
        const name = wer && this.projekte.find((p) => p.id === wer.projekt)?.name;
        eintrag.fehler = `Port ${port} ist schon belegt${name ? ` – von ${name}` : wer ? ` – von PID ${wer.pid}` : ''}. Den dort erst stoppen.`;
      } else if (reparieren) {
        eintrag.fehler = `Auch nach dem Neuinstallieren gescheitert (Code ${code ?? '?'}). ${fehlerAusLog(text)}`.trim();
      } else {
        eintrag.fehler = `Server beendet (Code ${code ?? '?'}). ${fehlerAusLog(text)}`.trim();
      }
    });
    kind.on('error', (f) => { eintrag.zustand = 'fehler'; eintrag.fehler = f.message; });
    this.aufnahmeZeit = 0;
    this.beobachten();
    protokoll(reparieren ? 'Reparatur-Start' : 'Start', projekt.ordner, installieren ? `${install} && ${lauf}` : lauf);
    return { ok: true };
  }

  async stoppePid(pid) {
    const { prozesse } = await this.momentaufnahme(true);
    const wurzel = stoppWurzel(pid, prozesse);
    await fuehreAus('taskkill', ['/PID', String(wurzel), '/T', '/F']);
    protokoll('Stopp', pid, 'ab', wurzel);
  }

  async stoppen({ pid, id }) {
    const st = await this.stand();
    const ziele = new Set();
    if (pid) {
      if (!st.server.some((s) => s.pid === pid)) return { status: 404, fehler: 'Kein Dev-Server mit dieser PID' };
      ziele.add(pid);
      // Hat der Agent diese Instanz gestartet, ist ihr Ende gewollt -- kein "Fehler".
      for (const [gid, g] of this.gestartet) {
        if (vomAgent(pid, this.aufnahme.prozesse, new Map([[gid, g]]))) { g.gestoppt = true; this.gestartet.delete(gid); }
      }
    }
    if (id) {
      for (const s of st.server) if (s.projekt === id) ziele.add(s.pid);
      const g = this.gestartet.get(id);
      if (g) { g.gestoppt = true; this.gestartet.delete(id); if (this.aufnahme?.prozesse.has(g.pid)) ziele.add(g.pid); }
    }
    for (const z of ziele) await this.stoppePid(z);
    for (const [gid, g] of this.gestartet) if (ziele.has(g.pid)) { g.gestoppt = true; this.gestartet.delete(gid); }
    this.aufnahmeZeit = 0;
    return { ok: true, gestoppt: ziele.size };
  }

  async alleStoppen() {
    const st = await this.stand();
    const ids = new Set(st.server.filter((s) => s.projekt).map((s) => s.projekt));
    for (const id of this.gestartet.keys()) ids.add(id);
    let zahl = 0;
    for (const id of ids) zahl += (await this.stoppen({ id })).gestoppt || 0;
    return { ok: true, gestoppt: zahl };
  }

  ausblenden(id, aus) {
    const projekt = this.projekte.find((p) => p.id === id);
    if (aus && projekt) this.einstellungen.ausblenden.push(projekt.ordner);
    if (!aus) this.einstellungen.ausblenden = [];
    schreibeJson(EINSTELLUNGEN, this.einstellungen);
    return { ok: true };
  }
}

function letzteZeilen(datei, zahl) {
  try {
    const text = fs.readFileSync(datei, 'utf8');
    return text.trim().split(/\r?\n/).slice(-zahl).join('\n');
  } catch { return ''; }
}

function leseKoerper(req) {
  return new Promise((resolve, reject) => {
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (d) => { text += d; if (text.length > 8192) { reject(new Error('zu gross')); req.destroy(); } });
    req.on('end', () => { try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new Error('kein JSON')); } });
    req.on('error', reject);
  });
}

function antworte(res, status, wert) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(wert));
}

function dienst() {
  const z = new Zentrale();
  const server = http.createServer(async (req, res) => {
    try {
      if (!erlaubterHost(req.headers.host)) return antworte(res, 403, { fehler: 'Host' });
      // Browser schicken bei Anfragen von fremden Seiten immer Origin mit.
      // Fehlt er, fragt ein Programm auf diesem Rechner (das Installationsskript).
      const ursprung = req.headers.origin;
      if (ursprung && !erlaubterUrsprung(ursprung)) return antworte(res, 403, { fehler: 'Diese Seite darf den Agenten nicht ansprechen' });
      if (ursprung) { res.setHeader('Access-Control-Allow-Origin', ursprung); res.setHeader('Vary', 'Origin'); }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        // Chromes Abfrage fuer Zugriffe von oeffentlichen Seiten auf localhost.
        if (req.headers['access-control-request-private-network']) res.setHeader('Access-Control-Allow-Private-Network', 'true');
        res.setHeader('Access-Control-Max-Age', '600');
        res.statusCode = 204;
        return res.end();
      }
      const pfad = req.url.split('?')[0];
      if (req.method === 'GET' && pfad === '/') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end(`miwale Dev-Agent ${VERSION} laeuft. Die Zentrale: ${z.einstellungen.seite}\n`);
      }
      if (req.method === 'GET' && pfad === '/status') return antworte(res, 200, await z.stand());
      if (req.method === 'GET' && pfad === '/log') {
        const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
        if (!/^[0-9a-f]{10}$/.test(id)) return antworte(res, 400, { fehler: 'id' });
        return antworte(res, 200, { text: letzteZeilen(path.join(LOGS, `${id}.log`), 80) });
      }
      if (req.method !== 'POST') return antworte(res, 404, { fehler: 'Unbekannt' });
      const daten = await leseKoerper(req);
      let antwort;
      if (pfad === '/starten') antwort = await z.starten(String(daten.id || ''), daten.oeffnen !== false);
      else if (pfad === '/stoppen') antwort = await z.stoppen({ pid: Number(daten.pid) || 0, id: daten.id ? String(daten.id) : '' });
      else if (pfad === '/alle-stoppen') antwort = await z.alleStoppen();
      else if (pfad === '/suchen') { z.neuSuchen(); antwort = { ok: true }; }
      else if (pfad === '/ausblenden') antwort = z.ausblenden(String(daten.id || ''), daten.aus !== false);
      else if (pfad === '/ordner') {
        const p = z.projekte.find((x) => x.id === daten.id);
        if (p) oeffneAdresse(p.ordner);
        antwort = p ? { ok: true } : { status: 404, fehler: 'Projekt unbekannt' };
      } else if (pfad === '/beenden') {
        antworte(res, 200, { ok: true });
        protokoll('Beendet auf Anfrage');
        return setTimeout(() => process.exit(0), 100);
      } else antwort = { status: 404, fehler: 'Unbekannt' };
      const { status = 200, ...rest } = antwort;
      return antworte(res, status, rest);
    } catch (f) {
      protokoll('Fehler', req.url, f.stack || f.message);
      return antworte(res, 500, { fehler: f.message });
    }
  });
  server.on('error', (f) => {
    // Laeuft schon einer: nichts zu tun.
    if (f.code === 'EADDRINUSE') process.exit(0);
    protokoll('Server:', f.message);
    process.exit(1);
  });
  server.listen(PORT, '127.0.0.1', () => {
    protokoll(`Agent ${VERSION} gestartet, pid ${process.pid}`);
    z.neuSuchen();
  });
}

// ---------------------------------------------------------------------------
// Aufruf von aussen: Autostart, Startmenue-Verknuepfung (Strg+Alt+D), Installation.

function fragAgent(pfad, methode = 'GET') {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: pfad, method: methode, timeout: 1500 }, (res) => {
      let text = '';
      res.on('data', (d) => { text += d; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

const warte = (ms) => new Promise((r) => setTimeout(r, ms));

// Der Zwischenprozess fuer einen Dev-Server: startet den Befehl mit eigener,
// unsichtbarer Konsole und Ausgabe ins Log, und endet mit ihm. taskkill /T auf
// ihn nimmt den ganzen Baum mit.
const KIND_UMGEBUNG = {
  // Kein eigener Browser-Tab vom Dev-Server: den oeffnet der Agent, wenn der Port steht.
  BROWSER: 'none', FORCE_COLOR: '0', NO_COLOR: '1',
  // pnpm prueft vor "run" sonst die Abhaengigkeiten und bricht z. B. bei nicht
  // freigegebenen Build-Skripten ab, obwohl alles da ist. Beim Installieren:
  // nicht freigegebene Build-Skripte nur melden, und ein node_modules von
  // einem anderen Ort (verschobenes Projekt) ohne Rueckfrage ersetzen -- ohne
  // Konsole bricht pnpm an der Rueckfrage sonst ab.
  pnpm_config_verify_deps_before_run: 'false', npm_config_verify_deps_before_run: 'false',
  pnpm_config_strict_dep_builds: 'false', npm_config_strict_dep_builds: 'false',
  pnpm_config_confirm_modules_purge: 'false', npm_config_confirm_modules_purge: 'false',
  npm_config_yes: 'true',
};

const NETZFEHLER = /ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ERR_SOCKET|network/i;

async function kindProzess(auftrag) {
  const { ordner, log, install, lauf } = JSON.parse(Buffer.from(auftrag, 'base64url').toString('utf8'));
  const schreib = (text) => fs.appendFileSync(log, text);
  const fuehre = (befehl) => new Promise((resolve) => {
    schreib(`\n> ${befehl}\n\n`);
    const fd = fs.openSync(log, 'a');
    const kind = spawn(befehl, { cwd: ordner, shell: true, windowsHide: true, stdio: ['ignore', fd, fd], env: { ...process.env, ...KIND_UMGEBUNG } });
    fs.closeSync(fd);
    kind.on('exit', (code) => resolve(code ?? 1));
    kind.on('error', (f) => { schreib(`\n${f.message}\n`); resolve(1); });
  });
  if (install) {
    let code = await fuehre(install);
    // Scheitert die Installation, liegt es meist am alten node_modules
    // (verschoben, halb geloescht, andere Paketmanager-Version): weg damit und
    // neu. Nicht bei Netzfehlern -- offline machte das alles nur schlimmer.
    if (code !== 0 && !NETZFEHLER.test(letzteZeilen(log, 40))) {
      schreib('\n> Installation gescheitert: node_modules wird neu aufgebaut.\n');
      try { fs.rmSync(path.join(ordner, 'node_modules'), { recursive: true, force: true, maxRetries: 3 }); } catch (f) { schreib(`${f.message}\n`); }
      code = await fuehre(install);
    }
    if (code !== 0) process.exit(code);
  }
  process.exit(await fuehre(lauf));
}

async function starter(argumente) {
  const seite = argumente.find((a) => a.startsWith('--seite='));
  if (seite) {
    const e = ladeEinstellungen();
    e.seite = seite.slice('--seite='.length);
    schreibeJson(EINSTELLUNGEN, e);
  }
  const antwort = await fragAgent('/');
  const laufendeVersion = antwort && Number((/Dev-Agent (\d+)/.exec(antwort.text) || [])[1]);
  if (antwort && laufendeVersion !== VERSION) {
    await fragAgent('/beenden', 'POST');
    await warte(600);
  }
  if (!antwort || laufendeVersion !== VERSION) {
    spawn(process.execPath, [fileURLToPath(import.meta.url), '--dienst'], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();
    for (let i = 0; i < 25 && !(await fragAgent('/')); i++) await warte(200);
  }
  if (argumente.includes('--oeffnen')) oeffneAdresse(ladeEinstellungen().seite);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argumente = process.argv.slice(2);
  if (argumente.includes('--dienst')) dienst();
  else if (argumente[0] === '--kind') kindProzess(argumente[1]);
  else starter(argumente);
}
