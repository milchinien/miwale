FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY ["miwale Portfolio.dc.html", "/usr/share/nginx/html/miwale Portfolio.dc.html"]
COPY ["miwale Portfolio Mobil.dc.html", "/usr/share/nginx/html/miwale Portfolio Mobil.dc.html"]
COPY support.js /usr/share/nginx/html/support.js
COPY _ds /usr/share/nginx/html/_ds
COPY assets /usr/share/nginx/html/assets

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
