# syntax=docker/dockerfile:1.7
#
# Image du frontend, en deux étages.
#
# Le premier compile ; le second ne contient que le résultat et un nginx. Rien de Node ne
# survit : ni `node_modules`, ni les sources, ni le gestionnaire de paquets. L'image finale
# tourne autour de quinze méga-octets, dont douze pour nginx lui-même.

# ── Compilation ──────────────────────────────────────────────────────────────────────────
FROM node:24.19.0-alpine AS build
WORKDIR /chantier

# `npm ci` est isolé de la copie des sources : tant que le verrou ne bouge pas, la couche
# d'installation est reprise du cache et le build ne retouche pas au réseau.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

# ── Service ──────────────────────────────────────────────────────────────────────────────
# `alpine-slim` plutôt qu'`alpine` : la variante complète embarque un environnement Perl et
# des scripts de gabarit dont un SPA n'a aucun usage, pour une trentaine de méga-octets.
#
# `nginx-unprivileged` plutôt que `nginx` : la même image, déjà réglée pour tourner sans
# root — PID et fichiers temporaires hors des chemins réservés, écoute sur 8080. Le faire à
# la main sur l'image officielle demande de réécrire trois chemins dans `nginx.conf`, et
# d'en oublier un suffit à empêcher le démarrage.
FROM nginxinc/nginx-unprivileged:1.31-alpine-slim AS runtime

# La configuration d'exemple écoute elle aussi sur 8080 : la laisser ferait deux serveurs en
# concurrence sur le même port.
# `apk upgrade` en plus du socle à jour : entre deux publications de l'image nginx, Alpine
# corrige ses paquets, et c'est là que dorment les failles qu'un scanner remonte. Sans cette
# ligne, l'image héritait d'un openssl en retard de quatre correctifs, dont deux critiques.
USER root
RUN apk upgrade --no-cache \
    && rm -f /etc/nginx/conf.d/default.conf
USER nginx

COPY nginx-securite.conf /etc/nginx/snippets/securite.conf
COPY nginx.conf /etc/nginx/conf.d/gestion-stock.conf
COPY --from=build --chown=nginx:nginx /chantier/dist/frontend-angular/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/sante | grep -q ok || exit 1

CMD ["nginx", "-g", "daemon off;"]
