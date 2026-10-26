#!/usr/bin/env bash
# Schaltet "Anmelden mit Google/Discord" auf miwale.com ein (README, "Anmelden
# einschalten"). Einmal auf dem Server ausfuehren, wenn play.miwale.com im DNS
# und im Ingress steht:
#
#   bash anmelden-einschalten.sh
#
# Fragt Client-IDs und Secrets verdeckt ab und schreibt sie in die .env neben
# docker-compose.prod.yml (nur fuer den Besitzer lesbar). Vorhandene Eintraege
# wie GLUT_PASSWORD bleiben stehen. Leere Eingabe = vorhandenen Wert behalten.
# Das Admin-Passwort fuer /admin wird dabei neu erzeugt und einmal angezeigt.
set -euo pipefail
COMPOSE_FILE="${COMPOSE_FILE:-/home/tobias/projects/miwale/docker-compose.prod.yml}"
ENV_FILE="$(dirname "$COMPOSE_FILE")/.env"
SPIELE="https://play.miwale.com"
SEITE="https://miwale.com"
fehler() { printf 'FEHLER: %s\n' "$*" >&2; exit 1; }

# 1. Ohne erreichbare Spiele-Adresse wuerden die Spiele nicht laden.
printf 'Pruefe %s ... ' "$SPIELE"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SPIELE/games/wavebreaker/" || true)"
[ "$code" = 200 ] || fehler "$SPIELE/games/wavebreaker/ antwortet mit '$code' statt 200. Erst DNS (play -> diesen Server) und Ingress mit TLS einrichten."
echo ok

# 2. Werte abfragen.
touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
alt() { sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1; }
setzen() {
  local tmp; tmp="$(mktemp)"
  grep -v "^$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  cat "$tmp" > "$ENV_FILE"; rm -f "$tmp"
}
fragen() { # name, verdeckt(0/1)
  local wert vorhanden; vorhanden="$(alt "$1")"
  if [ "$2" = 1 ]; then read -r -s -p "$1${vorhanden:+ (Enter = behalten)}: " wert; echo
  else read -r -p "$1${vorhanden:+ [$vorhanden]}: " wert; fi
  wert="${wert:-$vorhanden}"
  [ -n "$wert" ] || fehler "$1 fehlt."
  case "$wert" in *[[:space:]]*) fehler "$1 enthaelt Leerzeichen.";; esac
  setzen "$1" "$wert"
}
fragen GOOGLE_CLIENT_ID 0
fragen GOOGLE_CLIENT_SECRET 1
fragen DISCORD_CLIENT_ID 0
fragen DISCORD_CLIENT_SECRET 1
# Mit den Konten wird /admin wichtiger: immer ein neues, langes Passwort.
pw="$(openssl rand -base64 33 | tr -d '\n/+=')"
setzen BEWERTUNGEN_ADMIN_PASSWORT "$pw"
printf '\nNeues Admin-Passwort fuer %s/admin (jetzt sicher notieren, wird nicht nochmal gezeigt):\n  %s\n\n' "$SEITE" "$pw"
setzen SPIELE_ADRESSE "$SPIELE"

# 3. Neu starten und pruefen.
docker compose -f "$COMPOSE_FILE" up -d miwale
for _ in $(seq 1 30); do
  [ "$(docker inspect --format '{{.State.Health.Status}}' miwale 2>/dev/null)" = healthy ] && break
  sleep 2
done
antwort="$(curl -s --max-time 15 "$SEITE/api/konto/ich" || true)"
echo "$SEITE/api/konto/ich -> $antwort"
case "$antwort" in
  *discord*google*|*google*discord*) echo "Fertig: Anmelden mit Google und Discord ist an." ;;
  *) docker logs --tail 20 miwale; fehler "Anbieter fehlen noch, siehe Log oben." ;;
esac
