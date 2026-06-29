# PLANNING.md - Planificación Semanal y Avances

# FASE 1

## Semana 1 (29 de Abril - 05 de Mayo): Diseño y Setup Inicial
**Tareas Planificadas:**
* [x] Enviar correo a cristhian.aguilera@uss.cl con los nombres de los integrantes y el link al repositorio en GitHub.
* [x] Redactar y subir `DESIGN.md` y `PLANNING.md` al repositorio.
* [x] Inicializar el proyecto base con el framework React y el gestor de paquetes `pnpm`.

**Estado:**
* Completado

## Semana 2 (06 de Mayo - 12 de Mayo): DevOps, Creación de Recursos y Motor Base
**Tareas Planificadas:**
* [x] Configurar el archivo `.gitignore` adecuado para omitir las dependencias de Node.
* [x] Configurar el flujo inicial de GitHub Actions (`.github/workflows/main.yml`).
* [x] Crear los sprites/diseños base de los personajes y diseñar al menos algunos mapas iniciales.
* [x] Programar el movimiento básico del personaje en 2D (caminar, gravedad) junto con las mecánicas: salto, sistema de combate (golpear/disparar) y esquive.
* [x] Enlazar el personaje al mapa: implementar colisiones con el entorno y las primeras trampas.

**Estado:**
* Completado

## Semana 3 (13 de Mayo - 19 de Mayo): Clases, Jefes y Testing
**Tareas Planificadas:**
* [x] Implementar el sistema de clases (Luchador, Tanque, Mago) y aplicarlo al personaje base.
* [x] Programar la lógica del Jefe 1 (temática a ver pronto) y su mecánica especial de combate.
* [x] Escribir e implementar las pruebas unitarias requeridas para la lógica del juego.

**Estado:**
* Pendiente: pruebas unitarias

## Semana 4 (20 de Mayo - 27 de Mayo): Dockerización y Entrega Final
**Tareas Planificadas:**
* [x] Crear el archivo `Dockerfile` en la raíz del proyecto para contenerizar la aplicación web.
* [x] Configurar GitHub Actions para actualizar automáticamente el contenedor en DockerHub tras pasar las pruebas.
* [x] Redactar el archivo `README.md` incluyendo título, descripción, e instrucciones detalladas de ejecución local y con el contenedor de Docker.
* [x] Ejecutar pruebas manuales para asegurar que el juego sea robusto en los navegadores más comunes (Chrome, Firefox, Safari).
* [x] Realizar la revisión final asegurando que la última versión esté subida al repositorio de GitHub al cierre del día 28 de mayo de 2026.

**Estado:**
* Pendiente:

## Tareas pendientes:
* [x] Escribir e implementar las pruebas unitarias requeridas para la lógica del juego.
se penso en implementar pruebas unitarias sobre el sistema de guardado (localStorage) y sistema de puntaje el cual no fue terminado al no tener los mapas funcionales por lo que la tarea se aplazo.

* [x] Redactar el archivo `README.md` incluyendo título, descripción, e instrucciones detalladas de ejecución local y con el contenedor de Docker.
no se explicaron cambios del titula y falto cambiar descripción del juego por cambios de tematica durante el desarrollo, no se dieron las instruccion para la ejecucion local ni especificaciones de docker apesar de que el proyecto tenia las herramientas por darle prioridad al desarrollo de mapas.

* [x] Ejecutar pruebas manuales para asegurar que el juego sea robusto en los navegadores más comunes (Chrome, Firefox, Safari).
se le dio prioridad a completar la funcionalidad en su navegador base (chrome) por lo que no se probo en los demas.

# REPLANIFICAION (completar antes del segundo avance)

* [x] Actualizar DESIGN.md con los siguientes puntos:
- Mejoras y correcciones tomadas de la evaluación de la Solemne 2 (puntaje, cross-browser, README, pruebas).
- Nuevas mecánicas o pantallas del juego (login, registro, leaderboard, integración API externa).
- Arquitectura fullstack: diagrama o descripción de frontend → API REST → MongoDB; modelo de datos (User, Score) y endpoints principales.
- Servicio REST externo: qué API se usa, qué endpoints se consumen y para qué funcionalidad del juego.

**Lo que se logró:**

**Lo que no se logró y motivo:**

# FASE 2

## Semana 1 (15 de junio - 20 de junio)

**Avance 1 — martes 16 de junio: Saldar tareas pendientes de la Solemne 2 y estructurar el repositorio fullstack.**

**Tareas Planificadas**

* [x] Pruebas de compatibilidad cross-browser: ejecutar el juego en Firefox y Safari, registrar y corregir diferencias de comportamiento respecto a Chrome (eventos de teclado, canvas rendering, estilos CSS).
* [ ] Sistema de puntaje: completar la lógica de puntaje que quedó aplazada por los mapas; asegurarse de que incrementa correctamente al recoger ítems o superar niveles y se muestra en pantalla.
* [x] Pruebas unitarias del frontend (Solemne 2): implementar tests sobre el sistema de puntaje ya funcional y sobre el guardado en localStorage (guardar, recuperar y limpiar partida). Usar Jest o Vitest según el setup existente.
* [x] README.md base: actualizar título y descripción del juego con la temática final; agregar instrucciones de ejecución local e instrucciones para levantar con Docker (ya existente en el proyecto).

**Tareas nuevas**

* [x] Inicializar monorepo con pnpm (workspaces: frontend/, backend/)
* [x] Crear pnpm-lock.yaml y .gitignore adecuado (node_modules, .env, dist)
* [x] Configurar proyecto backend con Node.js + Express (o Fastify)
* [x] Instalar y configurar cookie-parser en Express (necesario para leer cookies httpOnly)
* [x] Conectar MongoDB con Mongoose (URI en variable de entorno)
* [x] Crear modelo User en Mongoose (username, email, passwordHash, createdAt, scores[])
- Jugadores: username, email, passwordHash, role: 'player', progress (nivel, puntaje), createdAt
- Admin: username, email, passwordHash, role: 'admin'
* [x] Implementar endpoint POST /api/auth/register con hash de contraseña (bcrypt)

**Lo que se logró:**

**Lo que no se logró y motivo:**

**Avance 2 — Jueves 18 de junio:  Implementar autenticación dual: cookies httpOnly para jugadores y JWT por header para admin.**

**Tareas planificadas:**

Autenticación de jugadores (cookie httpOnly):

* [x] POST /api/auth/register → crea usuario con role 'player', setea cookie httpOnly con JWT al finalizar
* [x] POST /api/auth/login → valida credenciales, responde seteando cookie httpOnly sessionToken=<JWT> con flags httpOnly, sameSite: 'strict', secure: true (en producción)
* [x] POST /api/auth/logout → limpia la cookie (res.clearCookie('sessionToken'))
* [x] GET /api/auth/me → lee el JWT desde req.cookies.sessionToken, retorna perfil del jugador
* [x] Middleware verifyPlayer: extrae y valida JWT desde req.cookies.sessionToken


Autenticación de admin (JWT por header):

* [x] POST /api/admin/login → valida credenciales de admin, retorna { token: <JWT> } en el body (sin cookie)
* [x] Middleware verifyAdmin: extrae y valida JWT desde req.headers.authorization (Bearer <token>)
* [x] Rutas de admin protegidas con verifyAdmin (p.ej. GET /api/admin/users → listar jugadores)

Frontend:

* [x] Pantalla de Registro y Login para jugadores (el navegador maneja la cookie automáticamente)
* [x] Panel de admin separado: guarda el JWT en memoria o localStorage y lo adjunta manualmente en cada petición
* [x] Proteger acceso al juego: redirigir a login si GET /api/auth/me falla

**Lo que se logró:**

**Lo que no se logró y motivo:**

## Semana 2 (22 de junio - 26 de junio)

**Avance 3 — lunes 22 de junio: Persistencia de puntajes, leaderboard y verificación de correcciones Solemne 2.**

**Tareas planificadas:**

* [x] Crear modelo Score: userId, nivel alcanzado, puntos, fecha (o embeber en User)
* [x] POST /api/scores → guarda puntaje al terminar partida; protegido con verifyPlayer (lee usuario desde la cookie)
* [x] GET /api/scores/leaderboard → top 10 puntajes globales (ruta pública)
* [x] GET /api/scores/me → historial de partidas del jugador autenticado (protegido con verifyPlayer)
* [x] Mostrar leaderboard y progreso personal en el frontend
* [x] Verificar que las correcciones de la Solemne 2 (puntaje, localStorage, cross-browser, README) funcionan correctamente en la nueva arquitectura fullstack

**Lo que se logró:**

**Lo que no se logró y motivo:**

**Avance 4 - Martes 23 de junio: Integrar servicio REST externo y conectar con la lógica del juego.**

**Tareas planificadas:**

* [x] Consumir la API REST externa elegida (documentada en DESIGN.md) desde el backend para evitar CORS y ocultar claves
- Ejemplo para juego de plataformas: Open Trivia DB para preguntas entre niveles, PokeAPI para personajes/enemigos temáticos, o cualquier API coherente con el juego
* [x] Crear endpoint proxy en el backend (p.ej. GET /api/external/...) que exponga los datos al frontend
* [x] Integrar la funcionalidad externa en alguna mecánica del juego (pantalla entre niveles, power-ups, etc.)
* [x] Pruebas manuales del flujo completo: registro → login (cookie) → jugar → guardar puntaje → ranking

**Lo que se logró:**

**Lo que no se logró y motivo:**

**Avance 5 — Jueves 25 de junio: Objetivo: Dockerización completa del proyecto.**

**Tareas planificadas:**

* [x] Escribir frontend/Dockerfile (build estático + servidor Nginx o similar)
* [x] Escribir backend/Dockerfile (Node.js, exponer puerto, variables de entorno)
* [ ] Escribir compose.yml que orqueste tres servicios:
- frontend (depende de backend)
- backend (depende de mongo)
- mongo (imagen oficial MongoDB, volumen persistente)
* [ ] Variables de entorno con .env (.env.example en el repo, .env en .gitignore):
- MONGO_URI, JWT_SECRET, ADMIN_JWT_SECRET (puede ser el mismo secret con claims distintos), COOKIE_SECRET, NODE_ENV
* [ ] Verificar que las cookies httpOnly funcionan correctamente con Docker (sameSite y secure según NODE_ENV)
* [ ] Probar docker compose up --build y verificar que el flujo completo funciona

**Lo que se logró:**

**Lo que no se logró y motivo:**

## Semana 3 (29 de junio - 02 de julio):Pruebas unitarias (frontend y backend) y configuración de CI/CD.

**Avance 6 — Lunes 29 de junio: Pruebas unitarias del backend y configuración de CI/CD.**

**Tareas planificadas:**

* [ ] Backend: pruebas unitarias con Jest o Vitest
- Test de POST /api/auth/register → verifica que se crea el usuario y se setea la cookie
- Test de POST /api/auth/login → verifica cookie en la respuesta para jugadores
- Test de POST /api/admin/login → verifica que retorna JWT en el body (sin cookie)
- Test de middleware verifyPlayer → falla si no hay cookie; pasa si la cookie es válida
- Test de middleware verifyAdmin → falla si no hay header; pasa si el token es válido
- Test de POST /api/scores → rechaza sin cookie, acepta con cookie válida
* [ ] Configurar GitHub Actions en .github/workflows/main.yml:
- Trigger: push a cualquier rama
- Job 1: linter (eslint) en frontend y backend
- Job 2: pruebas unitarias frontend
- Job 3: pruebas unitarias backend
- Job 4: build y push de imágenes a DockerHub (frontend y backend)
* [x] Crear cuenta en DockerHub y configurar secrets en GitHub (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)

**Lo que se logró:**

**Lo que no se logró y motivo:**

**Avance 7 — Martes 30 de junio: Pulir el juego, completar el README y hacer pruebas de integración.**

**Tareas planificadas:**

* [ ] Pruebas de integración end-to-end: registro → login (cookie) → jugar → puntaje → ranking
* [ ] Verificar que el CI/CD de GitHub Actions pasa correctamente (linter + tests + build)
* [ ] Completar README.md:
- Título y descripción del proyecto
- Instrucciones de ejecución local (frontend y backend por separado)
- Instrucciones con Docker Compose (docker compose up)
- Links a imágenes en DockerHub (frontend y backend)
* [ ] Revisar que DESIGN.md documenta correctamente la estrategia de autenticación dual, la API externa y la arquitectura
* [ ] Revisar PLANNING.md: actualizar todos los campos de avance logrado

**Lo que se logró:**

**Lo que no se logró y motivo:**

**Avance 8 — Jueves 2 de julio: Entrega final. Última revisión y limpieza del repositorio.**

**Tareas planificadas:**

* [ ] Último git push antes del cierre (verificar que la última versión está en main)
* [ ] Confirmar que docker compose up --build levanta los tres servicios sin errores
* [ ] Confirmar que GitHub Actions pasa (verde) en el último commit
* [ ] Revisar que los links de DockerHub en el README apuntan a las imágenes correctas
* [ ] Control de avance individual (preparar explicación del código propio)

**Lo que se logró:**

**Lo que no se logró y motivo:**

## MEJORAS
* [ ] implementar nivel principal antes de llegar al jefe.
* [x] implementar nivel jefe.
* [ ] crear habilidad especial para SHURI.
* [ ] crear habilidad especial para TYSON.
* [ ] crear habilidad especial para FROG.
* [ ] cambiar nombre de FROG.
* [ ] crear skin y animaciones para el jefe.
* [ ] diseñar barra de vida para el jefe.
* [ ] eliminar mensajes emergentes desde buscador e implementarlos dentro del juego.
* [ ] crear assets para titulos y botones.
* [ ] mejorar e implementar bien las mecanicas de movilidad.
* [ ] implementar intruccion sobre el juego al pie de la pantalla.