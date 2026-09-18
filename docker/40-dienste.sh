#!/bin/sh
# Startet die Dienste der Seite (Bewertungen, Game Requests, Konten; server/start.mjs)
# neben nginx. Das Einstiegsskript des nginx-Images fuehrt alles in
# /docker-entrypoint.d/ vor nginx aus; der Dienst laeuft darum im Hintergrund
# weiter. Stuerzt er ab, startet die Schleife ihn nach kurzer Pause neu, damit
# nicht die ganze Seite neu gestartet werden muss.
set -eu

mkdir -p /data
chown nginx:nginx /data

(
  while true; do
    su -s /bin/sh nginx -c "exec node /srv/dienste/start.mjs" || true
    echo "Dienste beendet, Neustart in 2 s" >&2
    sleep 2
  done
) &
