// ==========================================================
// tests/calcularPuntaje.test.js
//
// Tests UNITARIOS de la función calcularPuntaje (utils/calcularPuntaje.js).
// No necesitan mocks ni base de datos porque la función es pura:
// dado el mismo input, siempre devuelve el mismo output.
// Esto es la forma más simple de test unitario.
// ==========================================================

import { describe, it, expect } from 'vitest';
import {
    calcularPuntaje,
    PUNTOS_POR_NIVEL,
    PENALIZACION_POR_SEGUNDO,
    PENALIZACION_POR_DANO
} from '../utils/calcularPuntaje.js';

describe('calcularPuntaje', () => {
    it('calcula correctamente con valores normales', () => {
        // nivel 1 * 1000 - 90s * 2 - 30daño * 5 = 1000 - 180 - 150 = 670
        const resultado = calcularPuntaje({
            nivelAlcanzado: 1,
            tiempoSegundos: 90,
            danoRecibido: 30
        });
        expect(resultado).toBe(670);
    });

    it('nunca devuelve un puntaje negativo', () => {
        // nivel 0 con mucho tiempo y daño -> sería negativo sin el Math.max
        const resultado = calcularPuntaje({
            nivelAlcanzado: 0,
            tiempoSegundos: 9999,
            danoRecibido: 9999
        });
        expect(resultado).toBe(0);
    });

    it('con cero tiempo y cero daño, el puntaje es nivel * PUNTOS_POR_NIVEL', () => {
        const resultado = calcularPuntaje({
            nivelAlcanzado: 3,
            tiempoSegundos: 0,
            danoRecibido: 0
        });
        expect(resultado).toBe(3 * PUNTOS_POR_NIVEL);
    });

    it('un jugador mas rapido tiene mayor puntaje que uno lento en el mismo nivel', () => {
        const rapido = calcularPuntaje({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 0 });
        const lento = calcularPuntaje({ nivelAlcanzado: 1, tiempoSegundos: 300, danoRecibido: 0 });
        expect(rapido).toBeGreaterThan(lento);
    });

    it('quien recibe menos daño tiene mayor puntaje en el mismo nivel y tiempo', () => {
        const sinDano = calcularPuntaje({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 0 });
        const conDano = calcularPuntaje({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 100 });
        expect(sinDano).toBeGreaterThan(conDano);
    });

    it('llegar mas lejos siempre supera a ser perfecto en un nivel menor', () => {
        // Nivel 2 con algo de tiempo y daño vs nivel 1 perfecto (sin tiempo ni daño)
        const nivel2conPenalizacion = calcularPuntaje({
            nivelAlcanzado: 2,
            tiempoSegundos: 300,
            danoRecibido: 50
        });
        const nivel1perfecto = calcularPuntaje({
            nivelAlcanzado: 1,
            tiempoSegundos: 0,
            danoRecibido: 0
        });
        expect(nivel2conPenalizacion).toBeGreaterThan(nivel1perfecto);
    });

    it('usa las constantes exportadas correctamente en la formula', () => {
        const nivel = 2;
        const tiempo = 100;
        const dano = 20;
        const esperado = Math.max(
            Math.round(nivel * PUNTOS_POR_NIVEL - tiempo * PENALIZACION_POR_SEGUNDO - dano * PENALIZACION_POR_DANO),
            0
        );
        expect(calcularPuntaje({ nivelAlcanzado: nivel, tiempoSegundos: tiempo, danoRecibido: dano }))
            .toBe(esperado);
    });
});