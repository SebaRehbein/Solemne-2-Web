// ==========================================================
// Centraliza la lectura de los secretos de JWT usados en todo
// el backend, en vez de repetir `process.env.JWT_SECRET || '...'`
// en cada archivo de rutas/middlewares.
//
// A propósito, esto NO tiene un valor de respaldo ("secreto_de_respaldo")
// como tenía el código antes: si falta una variable de entorno, el
// servidor debe fallar fuerte y explícito al arrancar, no seguir
// corriendo silenciosamente firmando tokens con un secreto público
// conocido (cualquiera que lea el código en GitHub vería ese secreto).
//
// JWT_SECRET y ADMIN_JWT_SECRET son secretos separados (defensa en
// profundidad): un token de jugador, aunque se manipulara, nunca
// podría validarse como token de admin, porque están firmados con
// llaves distintas. Si en backend/.env ambos apuntan al mismo valor,
// sigue siendo válido (el propio enunciado del avance lo permite:
// "puede ser el mismo secret con claims distintos").
// ==========================================================

function leerSecretoObligatorio(nombreVariable) {
    const valor = process.env[nombreVariable];
    if (!valor) {
        throw new Error(
            `Falta la variable de entorno ${nombreVariable}. ` +
            `Revisa backend/.env (copia backend/.env.example si no lo tienes creado).`
        );
    }
    return valor;
}

export const JWT_SECRET = leerSecretoObligatorio('JWT_SECRET');
export const ADMIN_JWT_SECRET = leerSecretoObligatorio('ADMIN_JWT_SECRET');
export const COOKIE_SECRET = leerSecretoObligatorio('COOKIE_SECRET');