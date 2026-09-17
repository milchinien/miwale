import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTFOLIO = fileURLToPath(new URL('../miwale Portfolio.dc.html', import.meta.url));
const SEITEN = [
  /^\/$/,
  /^\/(start|projekte|ueber-mich|ki-workflow|devlog|kontakt)(\/[a-z0-9-]+(\/spielen)?)?\/?$/,
  // Ohne Schraegstrich am Ende: /games/chromatic/ ist das Spiel selbst.
  /^\/games(\/[a-z0-9-]+(\/spielen)?)?$/,
];

// Serve each frozen game as a static site. Vite's cached public-file index can
// otherwise miss new hashed files after games:sync, yielding an empty iframe.
export function gamesPreview() {
  const root = fileURLToPath(new URL('../public/games/', import.meta.url));
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.woff2':'font/woff2', '.ttf':'font/ttf' };
  return {
    name: 'game-bundles',
    configureServer(server) {
      // Kurze Seitenadressen wie in docker/nginx.conf: /, /projekte/chromatic
      // und /games/chromatic zeigen die Portfolio-Datei, die alten Dateinamen
      // und /games/ leiten um.
      server.middlewares.use((req,res,next) => {
        const url = new URL(req.url,'http://localhost');
        let path;
        try { path = decodeURIComponent(url.pathname); } catch { return next(); }
        const umleiten = (ziel) => { res.statusCode = 301; res.setHeader('Location', ziel + url.search); res.end(); };
        if (path === '/miwale Portfolio.dc.html' || path === '/miwale Portfolio Mobil.dc.html') return umleiten('/');
        if (/^\/games\/?$/i.test(path) && path !== '/games') return umleiten('/games');
        if (!SEITEN.some((muster) => muster.test(path))) return next();
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.setHeader('Cache-Control','no-cache');
        createReadStream(PORTFOLIO).on('error',() => res.destroy()).pipe(res);
      });
      server.middlewares.use('/games', (req,res) => {
        try {
          let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
          if (path.endsWith('/')) path += 'index.html';
          const file = resolve(root, '.' + path);
          if (!file.startsWith(resolve(root) + sep) || !statSync(file).isFile()) throw new Error('not found');
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
