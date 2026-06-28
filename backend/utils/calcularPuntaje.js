// Calcula el puntaje final de una partida.
//
// Reglas de diseño:
// - Quien llega más lejos (nivelAlcanzado) siempre puntúa más, sin importar
//   cuánto se tardó o cuánto daño recibió. Esto evita que alguien "perfecto"
//   en el nivel 1 le gane a alguien que llegó más lejos con algunos golpes.
// - Entre jugadores que llegaron al mismo nivel, gana quien fue más rápido
//   y recibió menos daño (penalizaciones).
// - El puntaje nunca es negativo.
export const PUNTOS_POR_NIVEL = 1000;
export const PENALIZACION_POR_SEGUNDO = 2;
export const PENALIZACION_POR_DANO = 5;

export function calcularPuntaje({ nivelAlcanzado, tiempoSegundos, danoRecibido }) {
    const base = nivelAlcanzado * PUNTOS_POR_NIVEL;
    const penalizacionTiempo = tiempoSegundos * PENALIZACION_POR_SEGUNDO;
    const penalizacionDano = danoRecibido * PENALIZACION_POR_DANO;

    const puntos = base - penalizacionTiempo - penalizacionDano;

    return Math.max(Math.round(puntos), 0);
}