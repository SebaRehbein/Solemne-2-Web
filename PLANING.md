# PLANNING.md - Planificación Semanal y Avances

## Semana 1 (29 de Abril - 05 de Mayo): Diseño y Setup Inicial
**Tareas Planificadas:**
* [x] Enviar correo a cristhian.aguilera@uss.cl con los nombres de los integrantes y el link al repositorio en GitHub.
* [x] Redactar y subir `DESIGN.md` y `PLANNING.md` al repositorio.
* [x] Inicializar el proyecto base con el framework React y el gestor de paquetes `pnpm`.

**Estado:**
* Completado: COMPLETADO
* Pendiente: 

## Semana 2 (06 de Mayo - 12 de Mayo): DevOps, Creación de Recursos y Motor Base
**Tareas Planificadas:**
* [x] Configurar el archivo `.gitignore` adecuado para omitir las dependencias de Node.
* [x] Configurar el flujo inicial de GitHub Actions (`.github/workflows/main.yml`).
* [x] Crear los sprites/diseños base de los personajes y diseñar al menos algunos mapas iniciales.
* [x] Programar el movimiento básico del personaje en 2D (caminar, gravedad) junto con las mecánicas: salto, sistema de combate (golpear/disparar) y esquive.
* [x] Enlazar el personaje al mapa: implementar colisiones con el entorno y las primeras trampas.

**Estado:**
* Completado: Completado
* Pendiente: diseñar mapas

## Semana 3 (13 de Mayo - 19 de Mayo): Clases, Jefes y Testing
**Tareas Planificadas:**
* [ ] Implementar el sistema de clases (Luchador, Tanque, Mago) y aplicarlo al personaje base.
* [x] Programar la lógica del Jefe 1 (temática a ver pronto) y su mecánica especial de combate.
* [ ] Escribir e implementar las pruebas unitarias requeridas para la lógica del juego.

**Estado:**
* Completado: 
* Pendiente: pruebas unitarias, clases creadas pero no aplicadas

## Semana 4 (20 de Mayo - 27 de Mayo): Dockerización y Entrega Final
**Tareas Planificadas:**
* [x] Crear el archivo `Dockerfile` en la raíz del proyecto para contenerizar la aplicación web.
* [x] Configurar GitHub Actions para actualizar automáticamente el contenedor en DockerHub tras pasar las pruebas.
* [ ] Redactar el archivo `README.md` incluyendo título, descripción, e instrucciones detalladas de ejecución local y con el contenedor de Docker.
* [ ] Ejecutar pruebas manuales para asegurar que el juego sea robusto en los navegadores más comunes (Chrome, Firefox, Safari).
* [ ] Realizar la revisión final asegurando que la última versión esté subida al repositorio de GitHub al cierre del día 28 de mayo de 2026.

**Estado:**
* Completado: 
* Pendiente:

## MEJORAS
* [ ] implementar nivel principal antes de llegar al jefe.
* [ ] implementar nivel jefe.
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