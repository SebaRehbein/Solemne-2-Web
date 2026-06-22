# DESIGN.md - Documento de Diseño: "Berry bad luck"

## 1. Descripción del Juego

**Concepto Principal:**
Es un juego de plataformas web en 2D que fusiona la dificultad extrema y trampas impredecibles de *I Wanna Be The Guy* con un sistema de progresión y elementos RPG. El jugador deberá superar niveles plataformeros, enfrentando trampas "troll" y jefes con mecánicas cambiantes, acumulando experiencia para mejorar sus estadísticas base.

**Mecánicas y Reglas:**
*   **Sistema de Clases:** Al iniciar, el jugador elige un arquetipo que define su estilo de juego base:
    *   *Luchador:* Salto doble corto, alta velocidad base.
    *   *Tanque:* Movimiento pesado, posee la habilidad pasiva de resistir una trampa mortal por nivel.
    *   *Mago:* Capacidad de flotar brevemente, pero muere instantáneamente al mínimo contacto.
*   **Progresión y Stats:** Al morir, el jugador pierde el progreso y iniciara desde el ultimo checkpoint.
*   **Jefes (Mecánicas Cambiantes):** El juego contará con 3 jefes principales basados en nuestras mascotas:
    1.  *Jefe Nivel 1 (El Inversor):* La pantalla y la gravedad rotan 180 grados a mitad de la pelea.
    2.  *Jefe Nivel 2 (El Relojero):* Altera el *framerate* de los obstáculos, mezclando cámara lenta y rápida para el jugador y los proyectiles.
    3.  *Jefe Final (Caos Total):* Oscurece la pantalla dejando solo un radio de luz alrededor del jugador e invierte los controles de movimiento esporádicamente (ideal mezclar todos los niveles anteriores para mas dificultad).

**Flujo de Juego:**
1.  **Pantalla de Inicio/Creación:** Selección de clase.
2.  **Nexo (Hub):** Menú para invertir experiencia en stats.
3.  **Fase de Niveles:** Superación de mapas con plataformas y trampas ocultas.
4.  **Fase de Jefe:** Batalla de supervivencia con mecánicas alteradas.
5.  **Game Over:** Retorno al ultimo checkpoint manteniendo la experiencia ganada.

---

## 2. Especificaciones de Tecnología

**Framework y Herramientas Base:**
*   **Frontend Framework:** React.js. *Justificación:* Permite crear componentes reutilizables (como enemigos o plataformas) de forma modular y manejar los estados complejos del juego eficientemente.
*   **Gestor de Paquetes:** `pnpm`.
*   **Lenguajes:** HTML, CSS y JavaScript.
*   **Testing:** Jest o React Testing Library para implementar pruebas unitarias.
*   **Despliegue y CI/CD:** Contenerización con un archivo `Dockerfile` y automatización con GitHub Actions conectando a DockerHub.

**Must Have (Debe tener):**
* Juego funcional desarrollado en React utilizando pnpm.
* Movimiento base del jugador (salto, gravedad, colisiones) y trampas letales.
* Al menos un nivel completo y el Jefe 1 (El Gato).
* Integración Continua con GitHub Actions para testing y actualización en DockerHub.
* Contenerización de la aplicación mediante Dockerfile.

**Should Have (Debería tener):**
* Los 3 jefes iniciales definidos.
* Selección de las 3 clases (Luchador, Tanque, Mago).
* Persistencia de la experiencia utilizando localStorage.

**Could Have (Podría tener si el tiempo lo permite):**
* Cuentas de usuario con base de datos en servidor.
* El roster completo de los 6 jefes originales.

**Won't Have (No tendrá por ahora):**
* Efectos de sonido y música de fondo.
* Animaciones de sprites detalladas.

---

## * Mejoras

| Mejora | Descripción |
|---|---|
| **Implementar niveles** | crear principal y nivel de jefe |
| **Crear nuevas hablidades caracteristicas** | crear habilidad especial que caracterice a cada personaje |
| **nuevos diseño y cambios** | darle un nombre caracteristico a frog y crear diseño para el jefe |
| **Instrucciones de jugabilidad** | Pantalla o overlay con los controles del juego al iniciar |
| **Diseñar Barra de vida para jefe** | diseñar una barra de vida que indique cuanta salud le queda al jefe al momento de pelear |
| **Eliminar mensajes emergentes** | Dar aviso a acciones dentro del juego en intancias dentro de el y no por navegador |
| **Mejoras de HUB** | crear assets para titulos y botones |
| **Ajustes de mecanicas** | mejorar e implementar bien las mecanicas de movilidad |

---

## * * Mejoras de Plataforma e Interfaz Web

| Mejora | Descripción |
|---|---|
| **Pantalla de Inicio de Sesión (Login)** | Interfaz para que los jugadores ingresen sus credenciales, conectada a la autenticación JWT para habilitar su progreso. |
| **Pantalla de Registro (Sign Up)** | Formulario para crear nuevas cuentas de jugador y generar automáticamente su avatar pixel art mediante el servicio externo. |
| **Panel de Administración (Dashboard)** | Interfaz protegida de acceso exclusivo para listar jugadores registrados, monitorear métricas y gestionar cuentas. |
| **Panel de Administración (Dashboard)** | Interfaz protegida de acceso exclusivo para listar jugadores registrados, monitorear métricas y gestionar cuentas. |
| **Tabla de Clasificación (Leaderboard)** | Pantalla pública para mostrar el Top de jugadores, ordenados por los puntajes máximos obtenidos al superar las fases del juego. |
| **Perfil del Jugador** | Sección privada donde el usuario puede visualizar su progreso actual, historial de puntuaciones y detalles de su cuenta. |
| **Menú Principal Web** | Pantalla de transición que conecta el flujo de autenticación de React con el arranque del lienzo del motor gráfico del juego. |
| **Pantallas de Estado (Loading/Error)** | Vistas de apoyo visual para indicar tiempos de carga al conectar con el servidor o mostrar alertas de error en la validación de formularios. |

---

## Arquitectura Fullstack

┌─────────────────────────────────────────────────────────────┐
│                          CLIENTE                            │
│                                                             │
│   React 19 + Phaser 4 (Pantallas + Juego)                   │
│   ├── Bóveda de Cookies : Almacena 'sessionToken' (Jugador) │
│   └── LocalStorage      : Almacena 'adminToken'   (Admin)   │
│                                                             │
│          │                               │                  │
│          ▼ AXIOS (HTTP)                  ▼ AXIOS (HTTP)     │
│   [Inyecta Cookie automáticamente]  [Inyecta Header Bearer] │
└──────────┼───────────────────────────────┼──────────────────┘
           │                               │ HTTP/JSON
           ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                            │
│                                                             │
│   Node.js + Express                                         │
│   ├── /api/auth  → verifyPlayer (Valida Cookie httpOnly)    │
│   └── /api/admin → verifyAdmin  (Valida Header Auth Bearer) │
│                                                             │
│   JWT (autenticación)  ·  bcrypt (hash de contraseñas)      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                          MONGODB                            │
│   Colecciones: users (incluye progress, scores y rol)       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ HTTP (En desarrollo)
┌─────────────────────────────────────────────────────────────┐
│                   SERVICIO REST EXTERNO                     │
│                       (EN PROCESO)                          │
└─────────────────────────────────────────────────────────────┘
---

## Estructura de carpetas del repositorio

solemne-2-web/
├── .github/
│   └── workflows/
│       └── main.yml                  # Flujos de trabajo de GitHub Actions (CI/CD)
├── backend/                          # Capa de Negocio y Datos (Node.js + Express)
│   ├── middlewares/
│   │   └── authMiddleware.js         # Validaciones de JWT (verifyPlayer, verifyAdmin)
│   ├── models/
│   │   └── User.js                   # Esquema de base de datos (Mongoose)
│   ├── routes/
│   │   ├── adminAuth.js              # Endpoints exclusivos para administradores
│   │   └── auth.js                   # Endpoints de autenticación de jugadores
│   ├── index.js                      # Punto de entrada del servidor API REST
│   ├── package-lock.json
│   └── package.json                  # Dependencias del backend
├── frontend/                         # Capa de Presentación (React + Phaser + Vite)
│   ├── public/
│   │   ├── assets/                   # Recursos estáticos públicos del juego
│   │   │   ├── animaciones/          # Spritesheets (Shuri, Tyson, Frog)
│   │   │   ├── mapa_inicial/         # Archivos Tiled (.tmj, .tmx)
│   │   │   ├── mapa_jefe/            # Assets de la arena del jefe
│   │   │   └── ...                   # Tilesets y texturas generales
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/                          # Código fuente de la interfaz web
│   │   ├── assets/                   # Imágenes de menús y UI
│   │   ├── App.css                   # Estilos principales
│   │   ├── App.jsx                   # Componente raíz (Lógica de Phaser y Menús)
│   │   ├── App.test.jsx              # Pruebas automatizadas (Frontend)
│   │   ├── index.css                 # Estilos globales
│   │   ├── localStorage.test.jsx     # Pruebas de persistencia
│   │   └── main.jsx                  # Punto de montaje de React
│   ├── eslint.config.js              # Configuración de linter
│   ├── index.html                    # Plantilla principal del frontend
│   ├── package.json                  # Dependencias del frontend
│   └── vite.config.js                # Configuración del empaquetador Vite
├── .gitignore                        # Archivos excluidos del control de versiones
├── DESIGN.md                         # Documentación de arquitectura fullstack
├── Dockerfile                        # Configuración de contenedorización
├── PLANING.md                        # Registro de planificación y tareas
├── README.md                         # Documentación principal del proyecto
├── package.json                      # Configuración del monorepositorio
├── pnpm-lock.yaml                    # Bloqueo de versiones de dependencias
└── pnpm-workspace.yaml               # Configuración del espacio de trabajo pnpm

---

## Modelo de Datos (MongoDB)

El proyecto utiliza **MongoDB** como base de datos NoSQL, estructurando y validando los documentos a través del ODM **Mongoose**. La persistencia del sistema está centralizada en una única colección optimizada que maneja tanto la autenticación como el estado del juego.

### Esquema: `User` (`backend/models/User.js`)

Este modelo actúa como el núcleo de persistencia. Unifica de forma segura las credenciales de acceso, los roles de autorización para el backend y las estadísticas de progreso para el motor del juego.

| Campo | Tipo de Dato | Propiedades / Restricciones | Descripción de la Lógica de Negocio |
| :--- | :--- | :--- | :--- |
| `username` | `String` | `required`, `unique`, `trim` | Identificador público del jugador. Se utiliza en el juego y como semilla (seed) para generar el avatar dinámico en la API externa. |
| `email` | `String` | `required`, `unique`, `lowercase` | Correo electrónico de contacto. El sistema fuerza el formato en minúsculas para evitar cuentas duplicadas por errores de tipeo. |
| `passwordHash` | `String` | `required` | Hash de seguridad de la contraseña. Nunca se almacena en texto plano; es procesado por `bcrypt` antes de la inserción. |
| `role` | `String` | `enum: ['player', 'admin']` | Define el nivel de privilegios del usuario para consumir la API. El valor por defecto al registrarse es `player`. |
| `progress` | `Object` | Embebido | Sub-documento que agrupa el estado de la progresión activa del personaje en el frontend. |
| ↳ `nivel` | `Number` | `default: 1` | Nivel actual de progresión dentro del sistema del juego. |
| ↳ `puntaje`| `Number` | `default: 0` | Cantidad de puntos acumulados en la sesión o progreso actual. |
| `scores` | `Array[Number]` | - | Historial en formato de lista (arreglo) que almacena todas las puntuaciones obtenidas por el jugador en partidas pasadas (ej. tras vencer al jefe). |
| `createdAt` | `Date` | `default: Date.now` | Sello de tiempo (timestamp) generado automáticamente por el servidor al crear el documento en la base de datos. |

---

## 5. Endpoints Principales de la API REST

La comunicación entre la capa de presentación y la capa de negocio se realiza mediante una interfaz de programación de aplicaciones (API) estructurada bajo los principios arquitectónicos REST. La API está dividida en dos módulos de enrutamiento principales según el contexto de autorización.

### 5.1. Módulo de Autenticación de Jugadores (`/api/auth`)

Gestiona el ciclo de vida de las sesiones de los usuarios comunes a través del uso de cookies seguras controladas por el navegador.

| Método | Ruta | Protección / Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Ninguna | Registra un nuevo jugador, genera su hash de contraseña, expide el JWT e inicia sesión de forma automática instalando la cookie `sessionToken`. |
| `POST` | `/api/auth/login` | Ninguna | Valida las credenciales del jugador. Si son correctas, genera un JWT válido por 1 día y lo configura en la cookie de sesión `sessionToken`. |
| `POST` | `/api/auth/logout` | Ninguna | Invalida la sesión activa destruyendo y limpiando la cookie `sessionToken` del cliente web. |
| `GET` | `/api/auth/me` | `verifyPlayer` | Recupera el perfil del jugador autenticado decodificando el identificador almacenado en la cookie de sesión de la petición HTTP. |

### Detalles de Esquemas de Carga Útil (Payloads)

* **`POST /api/auth/register` o `/api/auth/login`**
    * *Cuerpo de la Petición (JSON):*
        ```json
        {
          "username": "JugadorEjemplo", // Solo requerido en register
          "email": "jugador@correo.com",
          "password": "p********"
        }
        ```
    * *Respuesta Exitosa (HTTP 201 / 200):*
        ```json
        {
          "message": "Inicio de sesión exitoso.",
          "user": {
            "id": "64bbf8c9e2b1c432a1e45678",
            "username": "JugadorEjemplo",
            "email": "jugador@correo.com",
            "role": "player"
          }
        }
        ```

* **`GET /api/auth/me`**
    * *Respuesta Exitosa (HTTP 200):*
        ```json
        {
          "authenticated": true,
          "user": {
            "id": "64bbf8c9e2b1c432a1e45678",
            "username": "JugadorEjemplo",
            "email": "jugador@correo.com",
            "role": "player"
          }
        }
        ```

---

## Módulo de Administración y Control (`/api/admin`)

Provee las herramientas operativas para cuentas con privilegios administrativos. Aislado completamente del sistema de cookies, este módulo depende de la extracción explícita de tokens en las cabeceras del cliente.

| Método | Ruta | Protección / Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Ninguna | Autentica a un administrador validando que posea estrictamente el valor `role: 'admin'`. Devuelve el JWT en el cuerpo JSON para gestión local del cliente. |
| `GET` | `/api/admin/me` | `verifyAdmin` | Valida el token enviado en el encabezado `Authorization` y retorna los datos de perfil del administrador actual. |
| `GET` | `/api/admin/users` | `verifyAdmin` | Endpoint protegido de alta prioridad. Consulta la base de datos y retorna una lista detallada con el progreso, puntajes e identificación de todos los jugadores. |

## Detalles de Esquemas de Carga Útil (Payloads)

* **`POST /api/admin/login`**
    * *Cuerpo de la Petición (JSON):*
        ```json
        {
          "email": "superadmin@berrybadluck.com",
          "password": "a*******"
        }
        ```
    * *Respuesta Exitosa (HTTP 200):*
        ```json
        {
          "message": "Inicio de sesión de administrador exitoso.",
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Token Bearer de corta duración (4h)
          "user": {
            "id": "64bbf8c9e2b1c432a1e45111",
            "username": "SuperAdmin",
            "email": "superadmin@berrybadluck.com",
            "role": "admin"
          }
        }
        ```

* **`GET /api/admin/users`**
    * *Requisito de Cabecera:* `Authorization: Bearer <token>`
    * *Respuesta Exitosa (HTTP 200):*
        ```json
        {
          "message": "Listado de jugadores obtenido exitosamente.",
          "total": 1,
          "players": [
            {
              "_id": "64bbf8c9e2b1c432a1e45999",
              "username": "JugadorShuri",
              "email": "shuri@berrybadluck.com",
              "role": "player",
              "progress": {
                "nivel": 3,
                "puntaje": 1500
              },
              "scores": [500, 1000, 1500],
              "createdAt": "2026-06-22T06:00:00.000Z"
            }
          ]
        }
        ```
---

## Stack Tecnológico Completo

A continuación se detalla el conjunto de herramientas, librerías y servicios utilizados para el desarrollo, despliegue y mantenimiento del ecosistema de **Berry Bad Luck**:

| Herramienta | Rol dentro de la Arquitectura |
| :--- | :--- |
| **React 19** | Framework UI — Construcción de pantallas web (Login, Dashboard, Menús). |
| **Phaser 4** | Motor de juego 2D web — Lógica de físicas, game loop y renderizado en Canvas/WebGL. |
| **LocalStorage / Context** | Gestión del estado compartido (Teclas mapeadas, Token de Administrador). |
| **Axios** | Cliente HTTP del frontend para consumir la API REST y el servicio externo. |
| **Node.js + Express** | Entorno de ejecución y Framework para el servidor backend (API REST). |
| **Mongoose** | ODM (Object Data Modeling) para interactuar y validar esquemas en MongoDB. |
| **bcrypt** | Librería criptográfica para el hash seguro de contraseñas de usuarios. |
| **jsonwebtoken (JWT)** | Estándar para la emisión y verificación de credenciales de sesión y roles. |
| **cookie-parser** | Middleware de Express para la lectura y gestión de cookies de sesión `httpOnly`. |
| **MongoDB** | Base de datos NoSQL — Almacenamiento persistente de usuarios, puntajes y progreso. |
| **DiceBear API** | Servicio REST externo — Generación automatizada de avatares pixel art (En proceso). |
| **Vite** | Bundler del frontend — Herramienta de construcción y empaquetado ultra rápido. |
| **pnpm** | Gestor de paquetes centralizado y orquestador del monorepositorio (Workspaces). |
| **Vitest + Testing Library** | Entorno de ejecución de pruebas unitarias y de integración para el frontend. |
| **ESLint** | Linter — Análisis de código estático para asegurar calidad y estandarización. |
| **Docker** | Contenedorización de la aplicación (`Dockerfile`) para estandarizar el despliegue. |
| **GitHub Actions** | CI/CD — Flujos de trabajo automatizados para pruebas e integración continua. |