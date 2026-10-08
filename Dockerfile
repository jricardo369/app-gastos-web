# App Ionic/Angular (app-gastos) -> build de produccion + nginx en Docker
# Puerto interno: 80 (solo red interna de docker compose; el puerto 80 del host
# lo publica el reverse proxy de sitios-deploy-vjtech en la ruta /app-gastos/)
#
# NOTA: la politica de reinicio NO se fija aqui, se fija al crear el contenedor
# con `restart: unless-stopped` (ver docker-compose.yml del repo de infra).

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias (capa cacheada)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Codigo fuente
COPY . .

# base-href /app-gastos/ para que el router de Angular genere URLs con el
# prefijo. El proxy recorta /app-gastos/ antes de llegar a este contenedor,
# asi que internamente la app se sigue sirviendo en la raiz.
# Ver https://angular.dev/tools/cli/build#base-href
RUN npm run build -- --configuration production --base-href /app-gastos/

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/www /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1