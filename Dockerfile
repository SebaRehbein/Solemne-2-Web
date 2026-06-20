# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# 1. Copiar los archivos de configuración globales del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2. Copiar los package.json de cada espacio de trabajo para que pnpm sepa qué instalar
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Instalar de forma unificada las dependencias de todos los proyectos
RUN pnpm install

# Copiar todo el resto del código fuente del monorepo
COPY . .

# Construir la aplicación para producción (el script raíz delega a vite dentro de frontend)
RUN pnpm run build


# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior (la carpeta dist ahora se genera dentro de frontend)
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Exponer el puerto 80 para acceder a la aplicación
EXPOSE 80

# Comando por defecto para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]