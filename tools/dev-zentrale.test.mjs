import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erlaubterUrsprung, erlaubterHost, projektAusPaket, startBefehl, leseNetstat,
  zuordnen, stoppWurzel, baueServer, vergibNamen, fehlerAusLog, fehlendePakete, befehle, portBelegt,
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
