# DESIGN.md - Documento de Diseño: "The Glitched Ascendance"

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