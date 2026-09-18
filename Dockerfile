FROM nginx:alpine

# Node fuer die Dienste (server/: Bewertungen und Game Requests). Ohne npm:
# sie haben keine Abhaengigkeiten.
RUN apk add --no-cache nodejs

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY ["miwale Portfolio.dc.html", "/usr/share/nginx/html/miwale Portfolio.dc.html"]
COPY support.js /usr/share/nginx/html/support.js
COPY shop /usr/share/nginx/html/shop
COPY _ds /usr/share/nginx/html/_ds
COPY assets /usr/share/nginx/html/assets
COPY public /usr/share/nginx/html

COPY server /srv/dienste
COPY docker/40-dienste.sh /docker-entrypoint.d/40-dienste.sh
RUN chmod +x /docker-entrypoint.d/40-dienste.sh \
 && mkdir -p /data && chown nginx:nginx /data

# Bewertungen, Game Requests samt Bildern und Wortliste. In Produktion ein
# benanntes Volume, sonst sind sie
# nach dem naechsten Deployment weg (deploy/docker-compose.prod.yml). Welche
# Spiele bewertet werden duerfen, liest der Dienst aus dem Katalog der Seite.
VOLUME /data
ENV BEWERTUNGEN_ORDNER=/data \
    BEWERTUNGEN_KATALOG=/usr/share/nginx/html/shop/spiele.js

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
