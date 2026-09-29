#!/usr/bin/env bash
# One-time production setup. Keep the generated secret on the server only.
set -euo pipefail

site_dir=/home/tobias/projects/miwale
env_file="$site_dir/.env"
umask 077

if [ -e "$env_file" ] && [ ! -f "$env_file" ]; then
  echo 'Expected .env to be a regular file' >&2
  exit 1
fi

if [ ! -e "$env_file" ]; then
  printf 'GLUT_PASSWORD=%s\n' "$(openssl rand -hex 24)" > "$env_file"
elif ! grep -q '^GLUT_PASSWORD=' "$env_file"; then
  printf '\nGLUT_PASSWORD=%s\n' "$(openssl rand -hex 24)" >> "$env_file"
fi
chmod 600 "$env_file"
echo 'Glut password is configured in the server .env file.'
