import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { anwendungBauen } from '../server/bewertungen.mjs';
import { ideenBauen } from '../server/ideen.mjs';

// Lokal laufen die Dienste (Bewertungen, Game Requests) direkt in Vite, ohne
// Container. Die Daten landen in .bewertungen-dev/ (von Git ignoriert).
// Passwort fuer /admin/ ist "dev", solange BEWERTUNGEN_ADMIN_PASSWORT nichts
// anderes sagt.
export function diensteDev() {
  const ADMIN = fileURLToPath(new URL('../public/admin/index.html', import.meta.url));
  return {
    name: 'dienste-dev',
    configureServer(server) {
      const optionen = {
        ordner: fileURLToPath(new URL('../.bewertungen-dev/', import.meta.url)),
        passwort: process.env.BEWERTUNGEN_ADMIN_PASSWORT || 'dev',
      };
      const bewertungen = anwendungBauen(optionen);
      const ideen = ideenBauen(optionen);
      server.middlewares.use((req, res, next) => {
        const pfad = req.url.split('?')[0];
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
