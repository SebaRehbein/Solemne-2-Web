# ============================================================
# Etapa 1: Build (Node + pnpm)
# Compila el frontend (React + Vite) a archivos estáticos.
# El contexto de build debe ser la RAÍZ del monorepo, porque
# pnpm workspaces necesita ver pnpm-workspace.yaml y los
# package.json de todos los paquetes para resolver dependencias.
#   docker build -f frontend/Dockerfile -t solemne-frontend .
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copiar TODO el código antes de instalar. pnpm con workspaces crea
# node_modules con symlinks hacia un store central; si se instala
# primero y se copia el código después, el COPY sobrescribe esas
# carpetas y los symlinks se pierden (causa de "Cannot find module
# .../node_modules/vite/bin/vite.js").
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend ./frontend
COPY backend ./backend

RUN pnpm install --frozen-lockfile

# Compilar solo el paquete frontend (genera frontend/dist)
RUN pnpm --filter ./frontend run build


# ============================================================
# Etapa 2: Servidor estático (Nginx)
# Nginx no necesita Node ni pnpm: solo entrega los archivos
# que ya quedaron listos en frontend/dist.
# ============================================================
FROM nginx:alpine

# Config propia de Nginx para SPA (ver frontend/nginx.conf más abajo)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]