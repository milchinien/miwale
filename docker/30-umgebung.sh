#!/bin/sh
# Schreibt beim Start, was von der Umgebung abhaengt -- vor nginx, das
# Einstiegsskript des nginx-Images fuehrt /docker-entrypoint.d/ der Reihe nach aus.
#
#   MIWALE_ADRESSE   https://miwale.com  -- nur sie darf die Spiele einbetten.
#   SPIELE_ADRESSE   https://play.miwale.com -- dort laufen die Spiele, getrennt
#                    von Konten und Diensten. Leer: sie laufen unter
#                    MIWALE_ADRESSE mit (so lange, bis DNS und Ingress fuer
#                    play.miwale.com stehen).
#
# Die Werte landen in nginx-Konfiguration und JavaScript. Darum nur, was wie
# eine schlichte https-Adresse aussieht; alles andere bricht den Start ab.
set -eu

MIWALE_ADRESSE="${MIWALE_ADRESSE:-https://miwale.com}"
SPIELE_ADRESSE="${SPIELE_ADRESSE:-}"

# grep prueft Zeile fuer Zeile; ein Zeilenumbruch im Wert schluepfte sonst
# mit einer passenden Zeile durch. Darum zuerst: gar keiner.
adresse_ok() {
  [ "$(printf '%s' "$1" | tr -d '\n')" = "$1" ] && printf '%s' "$1" | grep -Eqx 'https://[a-z0-9.-]+'
}
if ! adresse_ok "$MIWALE_ADRESSE"; then
  echo "MIWALE_ADRESSE ist keine https-Adresse: $MIWALE_ADRESSE" >&2; exit 1
fi
if [ -n "$SPIELE_ADRESSE" ] && ! adresse_ok "$SPIELE_ADRESSE"; then
  echo "SPIELE_ADRESSE ist keine https-Adresse: $SPIELE_ADRESSE" >&2; exit 1
fi

mkdir -p /etc/nginx/miwale

# Wer die Spiele (play.miwale.com) einbetten darf.
printf 'add_header Content-Security-Policy "frame-ancestors %s" always;\n' "$MIWALE_ADRESSE" \
  > /etc/nginx/miwale/spiele-einbetten.conf

if [ -n "$SPIELE_ADRESSE" ]; then
  # Spieldateien gibt es dann nur noch dort. Auch ein direkter Link auf
  # miwale.com/games/chromatic/ laeuft so nie unter der Adresse der Seite.
  printf 'location ~ "^/games/[a-z0-9-]+/" {\n    return 301 "%s$request_uri";\n}\n' "$SPIELE_ADRESSE" \
    > /etc/nginx/miwale/spiele-umleitung.conf
else
  : > /etc/nginx/miwale/spiele-umleitung.conf
fi

printf '// Geschrieben von docker/30-umgebung.sh beim Start.\nwindow.MIWALE_UMGEBUNG = { spieleAdresse: "%s" };\n' "$SPIELE_ADRESSE" \
  > /usr/share/nginx/html/shop/umgebung.js
