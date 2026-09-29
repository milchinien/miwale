#!/usr/bin/env bash
# Pull both site images on the existing timer and restart only when changed.
set -euo pipefail
COMPOSE_FILE="${COMPOSE_FILE:-/home/tobias/projects/miwale/docker-compose.prod.yml}"
log() { printf '%s  %s\n' "$(date -Is)" "$*"; }

changed=0
for service in miwale glut; do
  image="ghcr.io/milchinien/${service}:latest"
  running_digest="$(docker inspect --format '{{.Image}}' "$service" 2>/dev/null || echo none)"
  log "Checking $service image"
  docker pull --quiet "$image" >/dev/null
  pulled_digest="$(docker image inspect --format '{{.Id}}' "$image")"
  if [ "$running_digest" != "$pulled_digest" ]; then changed=1; fi
done
if [ "$changed" -eq 0 ]; then log "Both images unchanged"; exit 0; fi

log "Starting updated services"
docker compose -f "$COMPOSE_FILE" up -d
for service in miwale glut; do
  healthy=0
  for _ in $(seq 1 30); do
    status="$(docker inspect --format '{{.State.Health.Status}}' "$service" 2>/dev/null || echo starting)"
    if [ "$status" = healthy ]; then healthy=1; break; fi
    if [ "$status" = unhealthy ]; then log "ERROR: $service unhealthy"; docker logs --tail 40 "$service"; exit 1; fi
    sleep 2
  done
  if [ "$healthy" -ne 1 ]; then log "ERROR: $service did not become healthy"; exit 1; fi
  log "$service healthy"
done
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "Done"
