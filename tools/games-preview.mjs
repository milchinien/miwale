import { createReadStream, readFileSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spielSeite, presseSeite, presseZip, sitemap, robots, feed, katalogLesen } from './seiten-lib.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const PORTFOLIO = fileURLToPath(new URL('../miwale Portfolio.dc.html', import.meta.url));
const SPIELESEITE = fileURLToPath(new URL('../index.html', import.meta.url));
const SEITEN = [
  [/^\/(portfolio|start|projekte|ueber-mich|ki-workflow|devlog|kontakt)(\/[a-z0-9-]+(\/spielen)?)?\/?$/, PORTFOLIO],
  // Ohne Schraegstrich am Ende: /games/chromatic/ ist das Spiel selbst.
  [/^\/games\/[a-z0-9-]+(\/spielen)?$/, SPIELESEITE],
  // Game Requests, eigener Reiter der Spieleseite.
  [/^\/requests(\/new)?\/?$/i, SPIELESEITE],
  // Bibliothek, Perlen-Shop, eigenes und fremde Profile.
  [/^\/(library(\/[a-z0-9-]+)?|pearls|profile)\/?$/i, SPIELESEITE],
  [/^\/u\/[A-Za-z0-9_-]{3,20}\/?$/, SPIELESEITE],
];

// Serve each frozen game as a static site. Vite's cached public-file index can
// otherwise miss new hashed files after games:sync, yielding an empty iframe.
export function gamesPreview() {
  const root = fileURLToPath(new URL('../public/games/', import.meta.url));
  const jamRoot = fileURLToPath(new URL('../public/jam-spiele/', import.meta.url));
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.woff2':'font/woff2', '.ttf':'font/ttf', '.glb':'model/gltf-binary', '.wasm':'application/wasm' };
  return {
    name: 'game-bundles',
    // Die Seite laedt ihre Skripte klassisch (<script src="shop/...">), nicht als
    // Module. Vite kennt sie darum nicht und laedt bei Aenderungen nichts neu --
    // "localhost aktualisiert sich nie". Hier: bei jeder Aenderung an der Seite
    // ein volles Neuladen; die eingefrorenen Spiele (public/games) zaehlen nicht.
    handleHotUpdate({ file, server }) {
      const pfad = file.replace(/\\/g, '/');
      if (pfad.includes('/public/games/') || pfad.includes('/public/jam-spiele/') || pfad.includes('/node_modules/') || pfad.includes('/.bewertungen-dev/')) return;
      if (/\/(shop|_ds|assets|public)\/|\/index\.html$|Portfolio\.dc\.html$|\/support\.js$/.test(pfad)) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
    configureServer(server) {
      // Kurze Seitenadressen wie in docker/nginx.conf: /portfolio und
      // /projekte/chromatic zeigen das Portfolio, /games/chromatic die
      // Spieleseite; die alten Dateinamen und /games leiten um.
      server.middlewares.use((req,res,next) => {
        const url = new URL(req.url,'http://localhost');
        let path;
        try { path = decodeURIComponent(url.pathname); } catch { return next(); }
        const umleiten = (ziel) => { res.statusCode = 301; res.setHeader('Location', ziel + url.search); res.end(); };
        if (path === '/miwale Portfolio.dc.html' || path === '/miwale Portfolio Mobil.dc.html') return umleiten('/portfolio');
        if (/^\/games\/?$/i.test(path)) return umleiten('/');
        // Erzeugte Seiten wie im Image (tools/seiten.mjs), bei jeder Anfrage neu aus dem Katalog.
        const senden = (typ, inhalt) => { res.setHeader('Content-Type', typ); res.setHeader('Cache-Control','no-cache'); res.end(inhalt); };
        // HTML mit Vites Client fuer das Neuladen (wie bei / von Vite selbst).
        const htmlSenden = (inhalt) => server.transformIndexHtml(path, inhalt).then((h) => senden('text/html; charset=utf-8', h), () => senden('text/html; charset=utf-8', inhalt));
        try {
          const spiel = /^\/games\/([a-z0-9-]+)(\/spielen)?$/.exec(path);
          const html = spiel && spielSeite(REPO, spiel[1]);
          if (html) return htmlSenden(html);
          if (/^\/press\/?$/.test(path)) return senden('text/html; charset=utf-8', presseSeite(REPO, katalogLesen(REPO), 0));
          if (path === '/press/miwale-presskit.zip') return senden('application/zip', presseZip(REPO));
          if (path === '/robots.txt') return senden('text/plain; charset=utf-8', robots());
          if (path === '/sitemap.xml') return senden('application/xml; charset=utf-8', sitemap(REPO));
          if (path === '/feed.xml') return senden('application/atom+xml; charset=utf-8', feed(REPO));
        } catch (fehler) {
          console.error('[seiten]', fehler.message);
        }
        const seite = SEITEN.find(([muster]) => muster.test(path));
        if (!seite) return next();
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.setHeader('Cache-Control','no-cache');
        let datei;
        try { datei = readFileSync(seite[1], 'utf8'); } catch { res.statusCode = 500; return res.end(); }
        return htmlSenden(datei);
      });
      // Dieselbe Auslieferung fuer die Jam-Spiele (/jam-spiele/<id>/): Vite
      // wuerde fuer Ordner sonst die Spieleseite zurueckgeben. /games zuletzt: der
      // Test greift sich die zuletzt eingehaengte Auslieferung.
      for (const [basis, ordner] of [['/jam-spiele', jamRoot], ['/games', root]]) server.middlewares.use(basis, (req,res) => {
        try {
          let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
          if (path.endsWith('/')) path += 'index.html';
          const file = resolve(ordner, '.' + path);
          if (!file.startsWith(resolve(ordner) + sep) || !statSync(file).isFile()) throw new Error('not found');
          res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');
          res.setHeader('Cache-Control','no-cache');
          res.setHeader('Content-Length',statSync(file).size);
          if (req.method === 'HEAD') return res.end();
          createReadStream(file).on('error',() => res.destroy()).pipe(res);
        } catch {
          res.statusCode = 404;
          res.end('Game asset not found');
        }
      });
    },
  };
}
