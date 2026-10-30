import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erlaubterUrsprung, erlaubterHost, projektAusPaket, startBefehl, leseNetstat,
  zuordnen, stoppWurzel, baueServer, vergibNamen, fehlerAusLog, fehlendePakete, befehle, portBelegt, portAusProjekt,
  erkenneArt, istProgrammOrdner, imArchiv, sindKopien, fasseKopienZusammen, leseGitLog, aendertProjekte,
  waehleStartSkript, waehleProgramm,
} from '../public/dev/agent.mjs';

test('nur miwale.com und localhost duerfen den Agenten ansprechen', () => {
  assert.equal(erlaubterUrsprung('https://miwale.com'), true);
  assert.equal(erlaubterUrsprung('http://localhost:5310'), true);
  assert.equal(erlaubterUrsprung('http://127.0.0.1:5173'), true);
  assert.equal(erlaubterUrsprung('https://play.miwale.com'), false);
  assert.equal(erlaubterUrsprung('http://miwale.com'), false);
  assert.equal(erlaubterUrsprung('https://miwale.com.boese.de'), false);
  assert.equal(erlaubterUrsprung('http://localhost.boese.de'), false);
  assert.equal(erlaubterUrsprung('null'), false);
  assert.equal(erlaubterHost('127.0.0.1:5300'), true);
  assert.equal(erlaubterHost('boese.de:5300'), false);
});

test('package.json: Skript und Paketmanager', () => {
  const namen = (...n) => new Set(n);
  assert.deepEqual(
    projektAusPaket({ scripts: { dev: 'vite' }, devDependencies: { vite: '6' } }, namen('pnpm-lock.yaml', 'node_modules')),
    { skript: 'dev', pm: 'pnpm', pmVersion: '', installiert: true, befehlText: 'vite' });
  assert.equal(projektAusPaket({ scripts: { start: 'node x' } }, namen()).skript, 'start');
  assert.equal(projektAusPaket({ scripts: { build: 'tsc' } }, namen()), null);
  assert.equal(projektAusPaket({ packageManager: 'yarn@4.1.0', scripts: { dev: 'x' } }, namen('pnpm-lock.yaml')).pm, 'yarn');
  assert.equal(projektAusPaket({ scripts: { dev: 'x' }, dependencies: { a: '1' } }, namen()).installiert, false);
  assert.equal(projektAusPaket({ scripts: { dev: 'x' } }, namen()).installiert, true, 'ohne Abhaengigkeiten nichts zu installieren');
});

test('Startbefehl installiert bei Bedarf zuerst', () => {
  assert.equal(startBefehl({ pm: 'pnpm', skript: 'dev', installiert: true }), 'pnpm run dev');
  assert.equal(startBefehl({ pm: 'npm', skript: 'start', installiert: false }), 'npm install && npm run start');
  assert.equal(startBefehl({ pm: 'yarn', skript: 'dev', installiert: true }), 'yarn dev');
});

test('fehlende Pakete: wie Node suchen, nicht nur node_modules ansehen', () => {
  const paket = { dependencies: { three: '1' }, devDependencies: { vite: '7' } };
  // Verschobenes Projekt: node_modules ist da, vite zeigt ins Leere.
  const da = new Set(['D:\\Spiele\\neu\\node_modules\\three\\package.json']);
  assert.deepEqual(fehlendePakete('D:\\Spiele\\neu', paket, (d) => da.has(d)), ['vite']);
  // Workspace: vite liegt beim Elternordner.
  da.add('D:\\Spiele\\node_modules\\vite\\package.json');
  assert.deepEqual(fehlendePakete('D:\\Spiele\\neu', paket, (d) => da.has(d)), []);
});

test('fehlt der Paketmanager, holt npx ihn', () => {
  const p = { pm: 'pnpm', pmVersion: '10.33.3', skript: 'dev', installiert: true };
  assert.deepEqual(befehle(p, true), { install: 'pnpm install', lauf: 'pnpm run dev' });
  assert.deepEqual(befehle(p, false), { install: 'npx -y pnpm@10.33.3 install', lauf: 'npx -y pnpm@10.33.3 run dev' });
  assert.equal(befehle({ pm: 'npm', skript: 'dev' }, false).lauf, 'npm run dev', 'npm kommt mit Node');
  assert.deepEqual(befehle(p, true, true), {
    install: 'pnpm install --config.confirm-modules-purge=false --config.strict-dep-builds=false',
    lauf: 'pnpm --config.verify-deps-before-run=false run dev',
  }, 'ohne Konsole: keine Rueckfragen, keine Vorab-Pruefung');
  assert.equal(projektAusPaket({ packageManager: 'pnpm@10.33.3+sha512.abc', scripts: { dev: 'x' } }, new Set()).pmVersion, '10.33.3');
});

test('belegter Port wird erkannt (dagegen hilft kein Neuinstallieren)', () => {
  assert.equal(portBelegt('error when starting dev server:\nError: Port 5275 is already in use'), 5275);
  assert.equal(portBelegt('Error: listen EADDRINUSE: address already in use :::3000'), 3000);
  assert.equal(portBelegt("Error: Cannot find module 'vite'"), 0);
});

test('netstat: lauschende Ports, auch auf deutschem Windows', () => {
  const text = [
    '  Proto  Lokale Adresse         Remoteadresse          Status           PID',
    '  TCP    0.0.0.0:5310           0.0.0.0:0              ABHÖREN          23812',
    '  TCP    127.0.0.1:5310         127.0.0.1:51000        HERGESTELLT      23812',
    '  TCP    [::1]:5173             [::]:0                 LISTENING        4711',
    '  TCP    [::]:5310              [::]:0                 ABHÖREN          23812',
    '  UDP    0.0.0.0:5353           *:*                                    999',
  ].join('\r\n');
  assert.deepEqual(leseNetstat(text), [
    { adresse: '0.0.0.0', port: 5310, pid: 23812 },
    { adresse: '::1', port: 5173, pid: 4711 },
  ]);
});

// Kette wie bei "pnpm dev" in einem Terminal.
const prozesse = new Map([
  [10, { pid: 10, eltern: 1, name: 'WindowsTerminal.exe', befehl: 'wt.exe' }],
  [11, { pid: 11, eltern: 10, name: 'powershell.exe', befehl: 'powershell.exe' }],
  [12, { pid: 12, eltern: 11, name: 'node.exe', befehl: '"C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\x\\AppData\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs" dev' }],
  [13, { pid: 13, eltern: 12, name: 'cmd.exe', befehl: 'C:\\WINDOWS\\system32\\cmd.exe /d /s /c "vite"' }],
  [14, { pid: 14, eltern: 13, name: 'node.exe', befehl: 'node   "D:\\Projects\\Website\\miwale\\node_modules\\.bin\\\\..\\vite\\bin\\vite.js" ' }],
  [20, { pid: 20, eltern: 1, name: 'node.exe', befehl: 'node "D:\\Projects\\Website\\miwale-styles-wt\\server.js"' }],
  [30, { pid: 30, eltern: 1, name: 'Discord.exe', befehl: 'Discord.exe' }],
  [40, { pid: 40, eltern: 1, name: 'node.exe', befehl: 'node irgendwas.js' }],
  [50, { pid: 50, eltern: 1, name: 'chrome.exe', befehl: 'chrome.exe --user-data-dir="D:\\Projects\\Website\\miwale\\.profil"' }],
]);
const projekte = [
  { id: 'a', ordner: 'D:\\Projects\\Website\\miwale' },
  { id: 'b', ordner: 'D:\\Projects\\Website\\miwale-styles-wt' },
  { id: 'c', ordner: 'D:\\Projects' },
];

test('Prozesse ihrem Projekt zuordnen, laengster Ordner gewinnt', () => {
  assert.equal(zuordnen(14, prozesse, projekte), 'a');
  assert.equal(zuordnen(20, prozesse, projekte), 'b', 'miwale-styles-wt ist nicht miwale');
  assert.equal(zuordnen(30, prozesse, projekte), null);
  assert.equal(zuordnen(40, prozesse, projekte, new Map([['z', { pid: 40 }]])), 'z', 'vom Agenten gestartet');
});

test('Stoppen beginnt beim obersten Glied der pnpm-Kette, nicht beim Terminal', () => {
  assert.equal(stoppWurzel(14, prozesse), 12);
  assert.equal(stoppWurzel(20, prozesse), 20);
});

test('Server-Liste: Projekte und Laufzeiten, nichts anderes', () => {
  const hoeren = [
    { adresse: '0.0.0.0', port: 5310, pid: 14 },
    { adresse: '::', port: 5310, pid: 14 },
    { adresse: '127.0.0.1', port: 6463, pid: 30 },
    { adresse: '127.0.0.1', port: 9000, pid: 40 },
    { adresse: '127.0.0.1', port: 5300, pid: 99 },
    { adresse: '127.0.0.1', port: 56624, pid: 50 },
  ];
  const liste = baueServer(hoeren, prozesse, projekte, new Map(), 99);
  assert.deepEqual(liste.map((s) => [s.pid, s.projekt, s.ports]), [[14, 'a', [5310]], [40, null, [9000]]],
    'Chrome mit Projektpfad gehoert nicht dazu');
  const vomAgent = baueServer(hoeren, prozesse, projekte, new Map([['z', { pid: 50 }]]), 99);
  assert.ok(vomAgent.some((s) => s.pid === 50), 'vom Agenten gestartet zaehlt es doch');
});

test('Fehler aus dem Log: Ursache statt Stacktrace', () => {
  const log = '> pnpm run dev\n> in D:\\x\n\nAlready up to date\n\n[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild\n\npnpm: Command failed with exit code 1\n    at getFinalError (pnpm.mjs:1)\n    at makeError (pnpm.mjs:2)';
  assert.equal(fehlerAusLog(log), '[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild\npnpm: Command failed with exit code 1');
});

test('gleichnamige Ordner bekommen den Elternordner dazu', () => {
  const p = vergibNamen([{ ordner: 'D:\\A\\tools' }, { ordner: 'D:\\B\\tools' }, { ordner: 'D:\\B\\miwale' }, { ordner: 'D:\\tmp\\mathequiz\\src' }]);
  assert.deepEqual(p.map((x) => x.name), ['tools (A)', 'tools (B)', 'miwale', 'mathequiz/src']);
});

// Fall aus der Praxis: ein Agent startet Vite per "cd /d/Projects/.../lighthouse &&
// node node_modules/vite/bin/vite.js". Der Ordner steht nur in der Git-Bash-Schreibweise
// im Vorfahren, der Server selbst hat einen relativen Pfad.
test('Server aus Git Bash und mit relativem Pfad gehoert trotzdem zu seinem Projekt', () => {
  const kette = new Map([
    [1, { pid: 1, eltern: 0, name: 'claude.exe', befehl: 'claude.exe' }],
    [2, { pid: 2, eltern: 1, name: 'bash.exe', befehl: 'bash.exe -c "eval \'cd \\"/d/Projects/JAM Games/AI BJM5/lighthouse\\" && node node_modules/vite/bin/vite.js\'"' }],
    [3, { pid: 3, eltern: 2, name: 'node.exe', befehl: '"C:\\Program Files\\nodejs\\node.exe" node_modules/vite/bin/vite.js' }],
    [4, { pid: 4, eltern: 1, name: 'node.exe', befehl: 'node server.js' }],
  ]);
  const liste = [
    { id: 'l', ordner: 'D:\\Projects\\JAM Games\\AI BJM5\\lighthouse', port: 5276 },
    { id: 'j', ordner: 'D:\\Projects\\JAM Games\\AI BJM5', port: 0 },
  ];
  assert.equal(zuordnen(3, kette, liste), 'l', 'laengster Ordner, MSYS-Pfad erkannt');
  // Nur ueber den Port: kein Ordner in der Kette, genau ein Projekt mit diesem Port.
  assert.equal(baueServer([{ adresse: '::1', port: 5276, pid: 4 }], kette, liste, new Map(), 99)[0].projekt, 'l');
  const doppelt = [...liste, { id: 'x', ordner: 'D:\\x', port: 5276 }];
  assert.equal(baueServer([{ adresse: '::1', port: 5276, pid: 4 }], kette, doppelt, new Map(), 99)[0].projekt, null, 'zwei Projekte mit dem Port: nicht raten');
});

test('fester Port aus dev-Skript oder vite.config', () => {
  assert.equal(portAusProjekt({ scripts: { dev: 'vite --port 5276' } }), 5276);
  assert.equal(portAusProjekt({ scripts: { dev: 'vite' } }, 'export default { server: { port: 5276, strictPort: true } }'), 5276);
  assert.equal(portAusProjekt({ scripts: { dev: 'vite' } }, 'export default {}'), 0);
});

test('Projektarten: nicht nur Node', () => {
  const namen = (...n) => new Set(n);
  assert.equal(erkenneArt(namen('package.json'), { devDependencies: { vite: '7' } }), 'Vite');
  assert.equal(erkenneArt(namen('package.json'), { dependencies: { next: '15', react: '19' } }), 'Next.js');
  assert.equal(erkenneArt(namen('package.json'), { scripts: { test: 'node --test' } }), 'Node');
  assert.equal(erkenneArt(namen('project.godot', 'scripts'), null), 'Godot');
  assert.equal(erkenneArt(namen('Assets', 'ProjectSettings', 'Library'), null), 'Unity');
  assert.equal(erkenneArt(namen('Cargo.toml', 'src', '.git'), null), 'Rust');
  assert.equal(erkenneArt(namen('index.html', 'style.css'), null), 'HTML');
  assert.equal(erkenneArt(namen('.git', 'docs', 'prototypes'), null), 'Git');
  assert.equal(erkenneArt(namen('build.gradle', 'gradlew', 'src'), null), 'Java');
  assert.equal(erkenneArt(namen('pom.xml', 'src'), null), 'Java');
  assert.equal(erkenneArt(namen('server.properties', 'eula.txt', 'mods', 'panel'), null), 'Minecraft');
  assert.equal(erkenneArt(namen('.claude-plugin', 'snake'), null), 'Claude-Mod');
  assert.equal(erkenneArt(namen('Bilder', 'notizen.txt'), null), null);
});

test('Projekte ohne Dev-Server: Startskript und gebautes Programm', () => {
  assert.equal(waehleStartSkript(['start.bat', 'Panel starten.bat', 'backup.ps1', 'eula.txt']), 'Panel starten.bat');
  assert.equal(waehleStartSkript(['Cargo.toml', 'start.bat']), 'start.bat');
  assert.equal(waehleStartSkript(['run.cmd']), 'run.cmd');
  assert.equal(waehleStartSkript(['build.bat', 'deploy.cmd', 'README.md']), null, 'Bauen ist kein Starten');
  const build = (...n) => n.map((x) => `D:\\S\\build\\windows-mingw-debug\\${x}`);
  assert.equal(waehleProgramm(build('SlimoriaAssetCooker.exe', 'SlimoriaEditorTests.exe', 'SlimoriaEditor.exe', 'SlimoriaEngine.exe')), build('SlimoriaEditor.exe')[0]);
  assert.equal(waehleProgramm(build('SlimoriaRhiTests.exe', 'SlimoriaEngine.exe')), build('SlimoriaEngine.exe')[0]);
  assert.equal(waehleProgramm(build('a_test.exe')), null);
});

test('Ueberwachung: neue, umbenannte und geloeschte Projekte loesen eine Suche aus', () => {
  const projekte = new Set(['d:\\projects\\jam games\\fg3', 'c:\\users\\michi\\desktop\\pet']);
  const aendert = (rel, ereignis = 'rename', wurzel = 'D:\\') => aendertProjekte(wurzel, rel, ereignis, projekte);
  // ausserhalb bekannter Projekte: neue oder umbenannte Ordner
  assert.equal(aendert('\\06_Experimente\\Neues Spiel'), true, 'Laufwerkswurzel liefert fuehrenden Backslash');
  assert.equal(aendert('06_Experimente\\Neues Spiel\\package.json'), true);
  assert.equal(aendert('06_Experimente\\Neues Spiel\\package.json', 'change'), true);
  assert.equal(aendert('03_Medien\\video.mp4'), false, 'Dateien sind keine Ordner');
  assert.equal(aendert('03_Medien\\Ordner', 'change'), false, 'nur Inhalt geaendert');
  // im Projekt: nur das Projekt selbst und Erkennungsdateien bis drei Ebenen tief
  assert.equal(aendert('Projects\\JAM Games\\FG3'), true, 'geloescht oder umbenannt');
  assert.equal(aendert('Projects\\JAM Games\\FG3\\src\\neu'), false);
  assert.equal(aendert('Projects\\JAM Games\\FG3\\src\\main.ts', 'change'), false);
  assert.equal(aendert('Projects\\JAM Games\\FG3\\prototypes\\a\\package.json'), true);
  assert.equal(aendert('Projects\\JAM Games\\FG3\\a\\b\\c\\d\\package.json'), false);
  // nie: node_modules, .git-Inneres, versteckte und uebersprungene Ordner
  assert.equal(aendert('Projects\\X\\node_modules\\vite\\package.json'), false);
  assert.equal(aendert('Projects\\JAM Games\\FG3\\.git\\index', 'change'), false);
  assert.equal(aendert('Projects\\Y\\.git'), true, 'neues Git-Projekt');
  assert.equal(aendert('Downloads\\entpackt'), false);
  // Benutzerordner: Wurzel ist der Unterordner
  assert.equal(aendert('pet', 'rename', 'C:\\Users\\michi\\Desktop'), true);
  assert.equal(aendert('pet\\src\\x', 'rename', 'C:\\Users\\michi\\Desktop'), false);
});

test('installierte Programme werden uebersprungen, Projekte mit Export nicht', () => {
  assert.equal(istProgrammOrdner(['git-bash.exe', 'unins000.exe', 'unins000.dat']), true);
  assert.equal(istProgrammOrdner(['Unity.exe', 'a.dll', 'b.dll', 'c.dll']), true);
  assert.equal(istProgrammOrdner(['Desktop Pet.exe', 'README.md']), false);
});

test('Backup-Kopien gehoeren zum Original', () => {
  assert.equal(imArchiv('E:\\Backup_D_vor-Umbau_2026-10-26\\Projects\\JAM Games\\FG3'), true);
  assert.equal(imArchiv('D:\\99_Archiv\\_Umbau\\verirrt-c'), true);
  assert.equal(imArchiv('D:\\Projects\\Browser\\Desktop\\Games\\CoD Copy'), false, 'nur Elternordner zaehlen');
  const d = { ordner: 'D:\\Projects\\JAM Games\\FG3' };
  const e = { ordner: 'E:\\Backup_D_vor-Umbau_2026-10-26\\Projects\\JAM Games\\FG3' };
  assert.equal(sindKopien(d, e), true, 'Pfad endet auf den anderen');
  assert.equal(sindKopien({ ordner: 'D:\\Projects\\JAM Games\\Fishing Game' }, { ordner: 'D:\\Projects\\Browser\\Games\\Fishing Game' }), false, 'gleicher Name, anderes Projekt');
  assert.equal(sindKopien({ ordner: 'D:\\tmp-tl\\Cozy', git: 'abc' }, { ordner: 'D:\\Spiele\\Cozy', git: 'abc' }), true, 'verschoben, gleiches erstes Commit');
  assert.equal(sindKopien({ ordner: 'D:\\Web\\miwale', git: 'abc' }, { ordner: 'D:\\Web\\miwale-styles-wt', git: 'abc' }), false, 'Worktree bleibt eigenstaendig');
  assert.equal(sindKopien({ ordner: 'D:\\A\\x', git: 'abc' }, { ordner: 'E:\\Backup\\A\\x', git: 'def' }), false, 'verschiedene Repos');
});

test('Kopien zusammenfassen: Original vorn, fruehestes Erstelldatum', () => {
  const [p, ...rest] = fasseKopienZusammen([
    { id: 'e', ordner: 'E:\\Backup_D\\Projects\\FG3', aktiv: 300, erstellt: 100, erstelltQuelle: 'dateien', skript: 'dev', art: 'Vite' },
    { id: 'd', ordner: 'D:\\Projects\\FG3', aktiv: 200, erstellt: 150, erstelltQuelle: 'dateien', skript: 'dev', art: 'Vite' },
    { id: 'n', ordner: 'D:\\Projects\\Neu', aktiv: 1, erstellt: 0, art: 'Git' },
  ]);
  assert.equal(rest.length, 1);
  assert.equal(p.id, 'd', 'nicht das Backup, auch wenn es juenger bearbeitet ist');
  assert.equal(p.erstellt, 100);
  assert.deepEqual(p.kopien, [{ id: 'e', ordner: 'E:\\Backup_D\\Projects\\FG3', aktiv: 300, backup: true }]);
  assert.equal(p.backup, false);
  const [nurBackup] = fasseKopienZusammen([{ id: 's', ordner: 'E:\\Backup_D\\Unity\\Slimoria', art: 'Unity' }]);
  assert.equal(nurBackup.backup, true);
  const [cozy] = fasseKopienZusammen([
    { id: 't', ordner: 'D:\\tmp-tl\\Cozy', git: 'abc', art: 'Git', aktiv: 9 },
    { id: 'g', ordner: 'D:\\Games\\Cozy', git: 'abc', art: 'Godot', aktiv: 1 },
  ]);
  assert.equal(cozy.id, 'g', 'tmp-Ordner und nur .git zaehlen weniger');
});

test('Git: erstes Commit des Ordners', () => {
  const a = 'a'.repeat(40);
  const b = 'b'.repeat(40);
  assert.deepEqual(leseGitLog(`${b} 1760000000\n${a} 1750000000\n`), { hash: a, erstellt: 1750000000000 });
  assert.equal(leseGitLog("fatal: your current branch 'master' does not have any commits yet"), null);
  assert.equal(leseGitLog(''), null);
});

test('nichtssagende Ordner wie "game" oder "prototype" bekommen den Elternordner davor', () => {
  const p = vergibNamen([{ ordner: 'D:\\Games\\The Labyrinth\\game' }, { ordner: 'D:\\Games\\The Labyrinth\\prototype' }]);
  assert.deepEqual(p.map((x) => x.name), ['The Labyrinth/game', 'The Labyrinth/prototype']);
});
