# ============================================================
# backend/Dockerfile
# Imagen del servidor Node/Express.
#
# Dos problemas resueltos con multi-stage + `pnpm deploy`:
#
# 1) bcrypt necesita compilar un binario nativo (python3/make/g++).
#    Esas herramientas (~150-200MB) solo se usan una vez, durante
#    el install, y no deben llegar a la imagen final.
#
# 2) En un workspace pnpm, `pnpm install` instala las dependencias
#    de TODOS los paquetes (frontend incluido: react, phaser, etc.),
#    no solo las del backend. Copiar ese node_modules completo a la
#    imagen final del backend arrastra ~300MB que nunca se usan.
#    `pnpm deploy --filter backend --prod` resuelve esto: genera una
#    carpeta autocontenida con SOLO el código y las dependencias de
#    producción del paquete backend, sin nada del resto del monorepo.
#    (Patrón recomendado por la documentación oficial de pnpm:
#    https://pnpm.io/docker)
#
# Contexto de build = raíz del monorepo:
#   docker build -f backend/Dockerfile -t solemne-backend .
# ============================================================

# ---------- Etapa 1: builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Herramientas nativas que necesita node-gyp para compilar bcrypt.
# Viven solo en esta etapa, nunca llegan a la imagen final.
RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm

# Copiar el código antes de instalar (si se instala primero y se
# copia el código después, el COPY pisa los symlinks que pnpm deja
# en node_modules).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend ./backend
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --frozen-lockfile

# Aísla SOLO el paquete backend (código + deps de producción) en
# /app/deploy, sin nada del frontend ni devDependencies.
# --legacy: backend y frontend no se referencian entre sí via
# "workspace:*", así que no se necesita el modo de "dependencias
# inyectadas" que pnpm v10 exige por defecto en `deploy`.
RUN pnpm --filter backend --prod deploy /app/deploy --legacy


# ---------- Etapa 2: runtime ----------
# Imagen limpia: sin pnpm, sin herramientas de compilación, sin
# rastro del resto del monorepo. Solo lo que /app/deploy contiene.
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/deploy ./

EXPOSE 3000

CMD ["node", "index.js"]