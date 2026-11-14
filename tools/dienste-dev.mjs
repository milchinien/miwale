import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { anwendungBauen } from '../server/bewertungen.mjs';
import { ideenBauen } from '../server/ideen.mjs';
import { stimmenBauen } from '../server/stimmen.mjs';
import { kontenBauen } from '../server/konten.mjs';
import { profilBauen } from '../server/profil.mjs';
import { jamBauen } from '../server/jam.mjs';
import { verwaltungBauen } from '../server/verwaltung.mjs';
import { adminSchutz } from '../server/gemeinsam.mjs';
import { studioBauen } from '../server/studio.mjs';
import { postBauen } from '../server/post.mjs';
import { spieleAusKatalog, KATALOG } from '../server/bewertungen.mjs';
import { existsSync, statSync } from 'node:fs';
import { join, extname, normalize, sep } from 'node:path';

// Hochgeladene Builds lokal ausliefern (/community/<slug>/, /vorschau/<build>/).
// In Produktion macht das nginx unter play.miwale.com.
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.data': 'application/octet-stream', '.pck': 'application/octet-stream', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
function buildDatei(res, ordner, rest) {
  let pfad = normalize(join(ordner, decodeURIComponent(rest || '')));
  if (pfad !== normalize(ordner) && !pfad.startsWith(normalize(ordner + sep))) { res.statusCode = 403; return res.end(); }
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad)) { res.statusCode = 404; return res.end('nicht gefunden'); }
  let name = pfad;
  const kopf = {};
  // Unity-Builds mit Kompression: .br/.gz mit passender Content-Encoding.
  if (/\.(br|gz)$/.test(name)) { kopf['Content-Encoding'] = name.endsWith('.br') ? 'br' : 'gzip'; name = name.replace(/\.(br|gz)$/, ''); }
  res.writeHead(200, { 'Content-Type': TYPEN[extname(name).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', ...kopf });
  createReadStream(pfad).pipe(res);
}

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
      const studioRef = {};
      const optionen = {
        ordner: fileURLToPath(new URL('../.bewertungen-dev/', import.meta.url)),
        passwort: process.env.BEWERTUNGEN_ADMIN_PASSWORT || 'dev',
      };
      // Verwaltung mit Admin-Konten (das erste Konto legt man mit dem Passwort "dev"
      // an) und Postausgang. Mails gehen lokal nirgends hin. Alle Dienste nehmen
      // die Admin-Sitzung an, wie in server/start.mjs.
      const post = postBauen({ ordner: optionen.ordner });
      const verwaltung = verwaltungBauen({ ...optionen, sicher: false, post });
      optionen.adminSchutz = adminSchutz(undefined, undefined, verwaltung);
      const konten = kontenBauen({
        ...optionen,
        // Lokal ohne HTTPS: Cookies ohne Secure und __Host-.
        sicher: false,
        zusatzAnbieter: TEST_ANBIETER,
        holen,
        // MIWALE_OHNE_KONTEN=1 zeigt die Seite wie live, solange Anmelden noch
        // nicht eingerichtet ist (Uebergang): alles ohne Konto.
        anbieter: process.env.MIWALE_OHNE_KONTEN === '1' ? {} : {
          test: { id: 'dev', secret: 'dev' },
          discord: { id: process.env.DISCORD_CLIENT_ID, secret: process.env.DISCORD_CLIENT_SECRET },
          google: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
        },
        // Lokal ohne Mail-Versand: E-Mail-Konten gelten sofort als bestaetigt.
        email: { aktiv: true, post: { aktiv: () => false, schicken: async () => ({}) } },
        beimLoeschen: (id) => { bewertungen.kontoLoeschen(id); ideen.kontoLoeschen(id); profil.kontoLoeschen(id); studioRef.studio.kontoLoeschen(id); },
        datenVon: (id) => ({ bewertungen: bewertungen.kontoDaten(id), ...ideen.kontoDaten(id), profil: profil.kontoDaten(id), studio: studioRef.studio.kontoDaten(id) }),
      });
      const bewertungen = anwendungBauen({ ...optionen, konten, weitereSpiele: () => studioRef.studio.liveIds(), beiBewertung: (id, spiel) => profil.ereignis(id, 'bewertung', spiel) });
      const ideen = ideenBauen({ ...optionen, konten, beiIdee: (id, idee) => profil.ereignis(id, 'idee', idee) });
      // Lokal sofort schreiben, damit man Aenderungen in der Datei sieht und ein Neustart nichts verliert.
      const profil = profilBauen({ ...optionen, konten, verzoegerungMs: 200, weitereSpiele: () => studioRef.studio.liveIds() });
      const stimmen = stimmenBauen(optionen);
      const jam = jamBauen(optionen);
      // Studio: lokal auch ohne eigene Spiele-Adresse (lokal: true).
      const studio = studioBauen({
        ...optionen, konten, verwaltung, post, lokal: true,
        adresse: 'http://localhost:' + (server.config.server.port || 5310),
        festeIds: spieleAusKatalog(KATALOG),
      });
      studioRef.studio = studio;
      server.middlewares.use((req, res, next) => {
        const pfad = req.url.split('?')[0];
        // Der Dev-Server ist auch im WLAN erreichbar (Handy). Die Test-Anmeldung
        // nicht: sonst meldete sich dort jeder als jeder an.
        if (/^\/api\/(konto-test\/|konto\/(anmelden|rueckruf)\/test)/.test(pfad) && !/^(::1|127\.|::ffff:127\.)/.test(req.socket.remoteAddress || '')) {
          res.statusCode = 403;
          return res.end('Test-Anmeldung nur auf diesem Rechner');
        }
        if (pfad === '/api/konto-test/anmelden') return testSeite(req, res);
        if (pfad === '/api/konto' || pfad.startsWith('/api/konto/')) return konten(req, res);
        if (pfad.startsWith('/api/bewertungen/')) return bewertungen(req, res);
        if (pfad === '/api/ideen' || pfad.startsWith('/api/ideen/')) return ideen(req, res);
        if (pfad === '/api/stimmen' || pfad.startsWith('/api/stimmen/')) return stimmen(req, res);
        if (pfad === '/api/profil' || pfad.startsWith('/api/profil/')) return profil(req, res);
        if (pfad === '/api/jam' || pfad.startsWith('/api/jam/')) return jam(req, res);
        if (pfad === '/api/studio' || pfad.startsWith('/api/studio/')) return studio(req, res);
        if (pfad === '/api/verwaltung' || pfad.startsWith('/api/verwaltung/')) return verwaltung(req, res);
        // Wie nginx: das Studio ist ein Reiter der Spieleseite.
        if (/^\/studio(\/[a-z0-9-]+(\/[a-z]+)?)?\/?$/i.test(pfad)) { req.url = '/index.html'; return next(); }
        const community = /^\/community\/([a-z0-9-]+)\/(.*)$/.exec(pfad);
        if (community) {
          const o = studio.liveOrdner(community[1]);
          if (!o) { res.statusCode = 404; return res.end(); }
          return buildDatei(res, o, community[2]);
        }
        const vorschau = /^\/vorschau\/([0-9a-f]{24})\/(.*)$/.exec(pfad);
        if (vorschau) {
          const o = studio.vorschauOrdner(vorschau[1]);
          if (!o) { res.statusCode = 404; return res.end(); }
          return buildDatei(res, o, vorschau[2]);
        }
        // Wie nginx: /styles und /Styles... fuehren auf /styles/, das die Galerie liefert.
        if (pfad === '/styles' || pfad.startsWith('/Styles')) {
          res.statusCode = 301;
          res.setHeader('Location', '/styles' + (pfad.slice(7) || '/') + req.url.slice(pfad.length));
          return res.end();
        }
        if (pfad === '/styles/') { req.url = '/styles/index.html' + req.url.slice(pfad.length); return next(); }
        // Dev-Zentrale wie in nginx: /dev -> /dev/, das liefert index.html.
        if (pfad === '/dev') { res.statusCode = 301; res.setHeader('Location', '/dev/' + req.url.slice(pfad.length)); return res.end(); }
        if (pfad === '/dev/') { req.url = '/dev/index.html' + req.url.slice(pfad.length); return next(); }
        // Jam-Seite wie in nginx: /jam -> /jam/, /jam/<id> ist dieselbe Seite.
        if (pfad === '/jam') { res.statusCode = 301; res.setHeader('Location', '/jam/' + req.url.slice(pfad.length)); return res.end(); }
        if (/^\/jam\/([a-z0-9-]+\/?)?$/.test(pfad)) { req.url = '/jam/index.html' + req.url.slice(pfad.length); return next(); }
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
