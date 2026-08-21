# ── Build ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Erst nur die Manifeste: solange die sich nicht aendern, bleibt der
# npm-ci-Layer im Cache und der Build ist schnell.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
