# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar los archivos de gestión de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar las dependencias del proyecto
RUN pnpm install

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción (Vite generará la carpeta 'dist')
RUN pnpm run build


# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80 para acceder a la aplicación
EXPOSE 80

# Comando por defecto para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]