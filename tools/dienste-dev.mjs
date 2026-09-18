import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { anwendungBauen } from '../server/bewertungen.mjs';
import { ideenBauen } from '../server/ideen.mjs';
import { kontenBauen } from '../server/konten.mjs';

// Lokal laufen die Dienste (Bewertungen, Game Requests, Konten) direkt in Vite,
// ohne Container. Die Daten landen in .bewertungen-dev/ (von Git ignoriert).
// Passwort fuer /admin/ ist "dev", solange BEWERTUNGEN_ADMIN_PASSWORT nichts
// anderes sagt.
//
// Anmelden geht lokal ueber einen Test-Anbieter: Er fragt nur nach einer
// beliebigen Kennung und tut so, als kaeme sie von Discord. So laesst sich alles
// mit Konten ausprobieren, ohne Discord- oder Google-Zugang. Den gibt es NUR
// hier; server/start.mjs kennt ihn nicht. Wer echte Anbieter lokal testen will,
// setzt DISCORD_CLIENT_ID/_SECRET bzw. GOOGLE_CLIENT_ID/_SECRET und traegt dort
// http://localhost:<port>/api/konto/rueckruf/<anbieter> als Adresse ein.
const TEST = 'http://test-anbieter.invalid/';
const TEST_ANBIETER = {
  test: {
    autorisieren: '/api/konto-test/anmelden',
    token: TEST + 'token',
    ich: TEST + 'ich',
    scope: 'test',
    kennung: (d) => d.id,
    extra: {},
  },
};

// Beantwortet die Anfragen, die sonst an Discord gingen: Der "Code" ist die
// eingegebene Kennung, das Token auch.
async function holen(url, init = {}) {
  if (!String(url).startsWith(TEST)) return fetch(url, init);
  const antwort = (daten) => new Response(JSON.stringify(daten), { headers: { 'content-type': 'application/json' } });
  if (url === TEST + 'token') return antwort({ access_token: new URLSearchParams(init.body).get('code') });
  return antwort({ id: String(init.headers.authorization).replace(/^Bearer /, '') });
}

function testSeite(req, res) {
  const url = new URL(req.url, 'http://lokal');
  const zurueck = url.searchParams.get('redirect_uri') || '';
  // Nur zurueck auf diese Seite selbst.
  if (!zurueck.startsWith('http://' + req.headers.host + '/api/konto/rueckruf/')) { res.statusCode = 400; return res.end('redirect_uri'); }
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><meta charset="utf-8"><title>Test-Anmeldung</title>' +
    '<body style="font:16px system-ui;background:#071A29;color:#fff;display:grid;place-items:center;min-height:90vh">' +
    '<form action="' + esc(zurueck) + '" method="get" style="display:grid;gap:12px;max-width:340px">' +
    '<h1 style="margin:0">Test-Anmeldung</h1><p style="margin:0;opacity:.8">Nur lokal. Gleiche Kennung = gleiches Konto.</p>' +
    '<input type="hidden" name="state" value="' + esc(url.searchParams.get('state') || '') + '">' +
    '<input name="code" value="tester-1" pattern="[A-Za-z0-9_-]{1,40}" required style="font:inherit;padding:8px">' +
    '<button style="font:inherit;padding:8px">Anmelden</button>' +
    '<a href="' + esc(zurueck) + '?error=access_denied&amp;state=' + esc(encodeURIComponent(url.searchParams.get('state') || '')) + '" style="color:#9cf">Abbrechen</a>' +
    '</form></body>');
}

export function diensteDev() {
  const ADMIN = fileURLToPath(new URL('../public/admin/index.html', import.meta.url));
  return {
    name: 'dienste-dev',
    configureServer(server) {
      const optionen = {
        ordner: fileURLToPath(new URL('../.bewertungen-dev/', import.meta.url)),
        passwort: process.env.BEWERTUNGEN_ADMIN_PASSWORT || 'dev',
      };
      const konten = kontenBauen({
        ...optionen,
        // Lokal ohne HTTPS: Cookies ohne Secure und __Host-.
        sicher: false,
        zusatzAnbieter: TEST_ANBIETER,
        holen,
        anbieter: {
          test: { id: 'dev', secret: 'dev' },
          discord: { id: process.env.DISCORD_CLIENT_ID, secret: process.env.DISCORD_CLIENT_SECRET },
          google: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
        },
        beimLoeschen: (id) => { bewertungen.kontoLoeschen(id); ideen.kontoLoeschen(id); },
        datenVon: (id) => ({ bewertungen: bewertungen.kontoDaten(id), ...ideen.kontoDaten(id) }),
      });
      const bewertungen = anwendungBauen({ ...optionen, konten });
      const ideen = ideenBauen({ ...optionen, konten });
      server.middlewares.use((req, res, next) => {
        const pfad = req.url.split('?')[0];
        if (pfad === '/api/konto-test/anmelden') return testSeite(req, res);
        if (pfad === '/api/konto' || pfad.startsWith('/api/konto/')) return konten(req, res);
        if (pfad.startsWith('/api/bewertungen/')) return bewertungen(req, res);
        if (pfad === '/api/ideen' || pfad.startsWith('/api/ideen/')) return ideen(req, res);
        if (pfad === '/admin') { res.statusCode = 301; res.setHeader('Location', '/admin/'); return res.end(); }
        if (pfad === '/admin/') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          return createReadStream(ADMIN).pipe(res);
        }
        next();
      });
    },
  };
}
