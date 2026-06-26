# Solemne 2 Proyecto Juego Web (BerryBadLuck)

## Información del Proyecto
* **Asignatura:** Aplicaciones y Tecnologías para la Web.
* **Profesor:** Cristhian Aguilera.
* **Integrantes:** Sebastian Rehbein y Mathias Carrera.
* **Descripción:** Proyecto enfocado en la construcción de un juego web funcional utilizando un framework de frontend y flujos de trabajo profesionales.

## ¿En qué consiste el trabajo?
El objetivo principal es desarrollar un juego que funcione en el navegador utilizando **React** y el gestor de paquetes **pnpm**. Más allá del código del juego, el proyecto evalúa la implementación de:

* **Documentación:** Registro de avances semanales y diseño detallado del sistema.
* **DevOps:** Uso de **Docker** para la contenedorización y **GitHub Actions** para automatizar pruebas y despliegue.
* **Calidad de Software:** Implementación de pruebas unitarias para asegurar que la lógica del juego sea robusta.

## Concepto del Juego
Es un juego de plataformas en 2D que combina la dificultad extrema de los juegos tipo *I Wanna Be The Guy* con elementos de progresión, donde el jugador puede mejorar sus estadísticas y enfrentar jefes con mecánicas cambiantes.

## Instrucciones para Ejecutar la Aplicación Localmente

### Prerrequisitos
Antes de comenzar, asegúrate de contar con las siguientes herramientas instaladas en tu sistema:
* **Node.js** (versión 26.0)
* **pnpm** (gestor de paquetes optimizado para el proyecto)

### Pasos de Instalación y Despliegue

1. **Clonar el repositorio:**

    ```bash
    git clone <https://github.com/SebaRehbein/Solemne-2-Web.git> # Descarga una copia exacta del proyecto a tu computadora
    cd Solemne-2-Web # Entra a la carpeta del proyecto recién descargado

2. **Instalar las dependencias del proyecto:**

    ```bash
    pnpm install # Descarga e instala todas las librerías necesarias (como React, Phaser, Vitest) para que el juego funcione

3. **Iniciar el servidor de desarrollo local:**

    ```bash
    pnpm dev # Enciende el servidor local para poder jugar y probar la aplicación en tu navegador

4. **Ejecutar la suite de pruebas unitarias:**
Para validar que el entorno virtual de localStorage y la configuración inicial pasen correctamente:

    ```bash
    pnpm test # Ejecuta los test automáticos para verificar que la lógica del almacenamiento funciona sin errores

5. **Compilar el proyecto para producción:**

    ```bash
    pnpm build # Empaqueta y optimiza el juego final, dejándolo listo y liviano para subir a un servidor web real

## Instrucciones para Ejecutar la Aplicación utilizando Docker

Este proyecto incluye soporte completo para contenedores, lo que permite ejecutar el juego de manera aislada sin necesidad de instalar dependencias locales de Node.js.

1. **Descargar la Imagen desde DockerHub**
Para obtener la versión precompilada y lista para jugar, ejecuta el siguiente comando en tu terminal:

    ```bash
    docker pull mathiasch/solemne-2-web:latest # Descarga la imagen del juego ya configurado directamente desde la nube

2. **Desplegar el Contenedor**
Inicia el contenedor en segundo plano exponiendo el servicio en el puerto 934 de tu máquina:

    ```bash
    docker run -d -p 934:80 --name berry-bad-luck mathiasch/solemne-2-web:latest # Enciende el juego en segundo plano (-d), lo conecta al puerto 934 y lo bautiza como 'berry-bad-luck'

3. **Detener y Limpiar el Contenedor**
Si necesitas detener el juego o remover el contenedor en ejecución:

    ```bash
    docker stop berry-bad-luck # Pausa y apaga la ejecución del juego de forma segura
    docker rm berry-bad-luck # Elimina el contenedor apagado para liberar memoria y poder usar el mismo nombre en el futuro
