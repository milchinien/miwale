import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serve each frozen game as a static site. Vite's cached public-file index can
// otherwise miss new hashed files after games:sync, yielding an empty iframe.
export function gamesPreview() {
  const root = fileURLToPath(new URL('../public/games/', import.meta.url));
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.woff2':'font/woff2', '.ttf':'font/ttf' };
  return {
    name: 'game-bundles',
    configureServer(server) {
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
