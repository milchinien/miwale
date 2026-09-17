import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { anwendungBauen } from '../server/bewertungen.mjs';

// Lokal laeuft der Bewertungsdienst direkt in Vite, ohne Container. Die Daten
// landen in .bewertungen-dev/ (von Git ignoriert). Passwort fuer /admin/ ist
// "dev", solange BEWERTUNGEN_ADMIN_PASSWORT nichts anderes sagt.
export function bewertungenDev() {
  const ADMIN = fileURLToPath(new URL('../public/admin/index.html', import.meta.url));
  return {
    name: 'bewertungen-dev',
    configureServer(server) {
      const handler = anwendungBauen({
        ordner: fileURLToPath(new URL('../.bewertungen-dev/', import.meta.url)),
        passwort: process.env.BEWERTUNGEN_ADMIN_PASSWORT || 'dev',
      });
      server.middlewares.use((req, res, next) => {
        const pfad = req.url.split('?')[0];
        if (pfad.startsWith('/api/bewertungen/')) return handler(req, res);
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
