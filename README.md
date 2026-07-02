# Berry Bad Luck

![CI/CD Pipeline](https://github.com/SebaRehbein/Solemne-2-Web/actions/workflows/main.yml/badge.svg)

## Información del Proyecto
* **Asignatura:** Aplicaciones y Tecnologías para la Web.
* **Profesor:** Cristhian Aguilera.
* **Integrantes:** Sebastian Rehbein y Mathias Carrera.

## Descripción

**Berry Bad Luck** es un juego de plataformas web en 2D que fusiona la dificultad extrema y las trampas impredecibles de *I Wanna Be The Guy* con un sistema de progresión de clases (Luchador, Tanque, Mago). El jugador debe superar niveles plataformeros esquivando trampas y enfrentando jefes con mecánicas de combate cambiantes.

Más allá del juego en sí, el proyecto es una aplicación **fullstack** completa:

* **Frontend:** React 19 + Phaser 4 (Vite), con pantallas de registro, login, leaderboard y perfil.
* **Backend:** Node.js + Express, con autenticación dual (cookies `httpOnly` para jugadores, JWT por header para administradores) y persistencia en MongoDB vía Mongoose.
* **Servicio externo:** integración con la API de [DiceBear](https://www.dicebear.com/) para generar avatares pixel art a partir del username.
* **DevOps:** contenedorización con Docker (imágenes separadas para frontend y backend), orquestación con Docker Compose y un pipeline de CI/CD en GitHub Actions (lint + tests + build/push a DockerHub).

Para el detalle completo de la arquitectura, el modelo de datos y los endpoints de la API, ver [DESIGN.md](DESIGN.md).

---

## Instrucciones para Ejecutar la Aplicación Localmente

Frontend y backend son paquetes independientes dentro de un monorepo con `pnpm` workspaces, así que se instalan juntos pero se levantan por separado.

### Prerrequisitos
* **Node.js** (v20 o superior)
* **pnpm** (gestor de paquetes del monorepo)
* **MongoDB** corriendo localmente en `mongodb://127.0.0.1:27017` (instalado en el sistema, o vía Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`)

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/SebaRehbein/Solemne-2-Web.git
cd Solemne-2-Web
pnpm install   # instala las dependencias de frontend y backend (workspaces)
```

### 2. Levantar el backend

```bash
cp backend/.env.example backend/.env
# Editar backend/.env y completar JWT_SECRET, ADMIN_JWT_SECRET y COOKIE_SECRET
# con valores propios (ver los comentarios del archivo .env.example)

pnpm --filter ./backend run dev   # servidor con recarga automática en http://localhost:3000
```

### 3. Levantar el frontend

En otra terminal:

```bash
pnpm --filter ./frontend run dev   # http://localhost:5173
```

El frontend consume la API en `http://localhost:3000/api`, así que el backend debe estar corriendo para poder registrarse, iniciar sesión y guardar puntajes.

### 4. Pruebas y linter

```bash
pnpm --filter ./frontend run test    # tests del frontend (Vitest)
pnpm --filter ./backend run test     # tests del backend (Vitest + Supertest + mongodb-memory-server)

pnpm --filter ./frontend run lint    # ESLint frontend
pnpm --filter ./backend run lint     # ESLint backend
```

### 5. Compilar el frontend para producción

```bash
pnpm --filter ./frontend run build
```

---

## Instrucciones para Ejecutar la Aplicación con Docker Compose

El proyecto incluye `compose.yml`, que orquesta tres servicios: `mongo` (base de datos con volumen persistente), `backend` (API Express) y `frontend` (build estático servido con Nginx).

### Prerrequisitos
* **Docker** y **Docker Compose**

### Pasos

1. **Configurar variables de entorno del backend:**

    ```bash
    cp backend/.env.example backend/.env
    # Completar JWT_SECRET, ADMIN_JWT_SECRET y COOKIE_SECRET con valores propios
    ```

    > `MONGO_URI` no hace falta tocarlo: `compose.yml` lo sobrescribe automáticamente para que el backend hable con el servicio `mongo` de la red interna de Docker.

2. **Levantar los tres servicios:**

    ```bash
    docker compose up --build
    ```

    * Frontend disponible en [http://localhost:5173](http://localhost:5173)
    * Backend (API) disponible en [http://localhost:3000](http://localhost:3000)
    * MongoDB queda accesible solo dentro de la red de Docker (no se expone al host, por seguridad)

3. **Detener los servicios:**

    ```bash
    docker compose down       # detiene y elimina los contenedores (conserva los datos de Mongo)
    docker compose down -v    # además elimina el volumen de Mongo (resetea la base de datos)
    ```

---

## Imágenes en DockerHub

Las imágenes de frontend y backend se construyen y publican automáticamente en cada push a `main` que pasa el pipeline de CI (lint + tests):

* **Frontend:** [mathiasch/berrybadluck-frontend](https://hub.docker.com/r/mathiasch/berrybadluck-frontend)

  ```bash
  docker pull mathiasch/berrybadluck-frontend:latest
  ```

* **Backend:** [mathiasch/berrybadluck-backend](https://hub.docker.com/r/mathiasch/berrybadluck-backend)

  ```bash
  docker pull mathiasch/berrybadluck-backend:latest
  ```

> Para levantar el proyecto completo (incluyendo MongoDB y las variables de entorno correctas) se recomienda usar `docker compose up --build` en vez de correr estas imágenes sueltas.
