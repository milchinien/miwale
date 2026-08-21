#!/usr/bin/env bash
#
# Holt ein neues miwale-Image aus GHCR und startet den Container neu –
# aber nur, wenn sich der Image-Digest tatsaechlich geaendert hat.
#
# Pull-basiert, weil dev-cloud hinter Tailscale liegt und von aussen nicht
# per SSH erreichbar ist. Die Pipeline muss den Server damit nicht kennen.
#
# Aufruf per systemd-Timer (miwale-deploy.timer) oder von Hand.

set -euo pipefail

IMAGE="ghcr.io/milchinien/miwale:latest"
COMPOSE_FILE="${COMPOSE_FILE:-/home/tobias/projects/miwale/docker-compose.prod.yml}"
CONTAINER="miwale"

log() { printf '%s  %s\n' "$(date -Is)" "$*"; }

# Digest des aktuell laufenden Containers …
running_digest="$(docker inspect --format '{{.Image}}' "$CONTAINER" 2>/dev/null || echo "none")"

log "Prüfe auf neues Image …"
docker pull --quiet "$IMAGE" >/dev/null

# … gegen den des frisch gezogenen Images.
pulled_digest="$(docker image inspect --format '{{.Id}}' "$IMAGE")"

if [ "$running_digest" = "$pulled_digest" ]; then
  log "Unverändert (${pulled_digest:7:12}) – nichts zu tun."
  exit 0
fi

log "Neues Image, starte neu …"
docker compose -f "$COMPOSE_FILE" up -d

# Warten, bis der Healthcheck greift; sonst meldet der Timer Erfolg, obwohl
# der Container gleich wieder stirbt.
for _ in $(seq 1 30); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo starting)"
  [ "$status" = "healthy" ] && { log "Läuft und ist gesund."; break; }
  [ "$status" = "unhealthy" ] && { log "FEHLER: Container ungesund."; docker logs --tail 40 "$CONTAINER"; exit 1; }
  sleep 2
done

# Alte Layer aufräumen, sonst laeuft die Platte langsam voll.
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "Fertig."
