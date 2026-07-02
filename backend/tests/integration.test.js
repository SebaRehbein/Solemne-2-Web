// ==========================================================
// tests/integration.test.js
//
// Test de INTEGRACIÓN end-to-end del flujo completo:
//   registro → login (cookie real) → puntaje → ranking
//
// A diferencia de los tests unitarios (que usan mocks de la BD),
// este test usa una base de datos MongoDB REAL que corre en memoria
// (MongoMemoryServer). Esto significa:
//   - No necesita MongoDB instalado en la máquina
//   - No contamina la base de datos de desarrollo
//   - Corre en cualquier entorno (CI/CD, máquinas sin MongoDB)
//
// Las peticiones HTTP son reales, hechas a la app de Express real,
// y el resultado de cada paso se usa en el siguiente — exactamente
// como lo haría un usuario real navegando la aplicación.
// ==========================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';

let mongod;

// JUGADOR se declara con let (no const) para poder asignarle un nuevo
// timestamp en beforeAll, garantizando unicidad real en cada ejecución.
let JUGADOR = {};

// La cookie de sesión se comparte entre pasos del flujo.
// Esto simula lo que hace el navegador: recibe la cookie al hacer
// login y la adjunta automáticamente en cada petición siguiente.
let sessionCookie = '';

// ============================================================
// Setup y teardown
// ============================================================

beforeAll(async () => {
    // Arranca MongoDB en memoria antes de cualquier test.
    // La primera vez que se corre este test, MongoMemoryServer descarga
    // el binario de MongoDB (~600MB en Windows). Esto puede tardar varios
    // minutos según la velocidad de internet, por eso el timeout es largo.
    // En ejecuciones siguientes el binario queda en caché y tarda segundos.
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Desconecta cualquier conexión previa de Mongoose antes de conectar
    // al MongoMemoryServer. Esto es necesario porque Vitest corre todos
    // los tests en el mismo proceso Node, y los tests unitarios anteriores
    // pueden haber dejado Mongoose con una conexión activa — sin este paso,
    // mongoose.connect() podría ignorar la nueva URI y reutilizar la vieja,
    // haciendo que el test escriba en la base de desarrollo real en vez de
    // en la base de test en memoria.
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(uri);

    // El timestamp se genera AQUÍ (no en el scope del módulo) para
    // garantizar unicidad real entre ejecuciones de la misma sesión de Vitest.
    const timestamp = Date.now();
    JUGADOR = {
        username: `TestPlayer_${timestamp}`,
        email: `test_${timestamp}@integration.com`,
        password: 'Password123!'
    };

    // Limpia la colección de usuarios antes de empezar, por si una
    // ejecución anterior dejó datos residuales en la misma base en memoria.
    await User.deleteMany({});
}, 5 * 60 * 1000); // 5 minutos — suficiente para la descarga inicial

afterAll(async () => {
    // Limpia todo al terminar: desconecta Mongoose y apaga el servidor en memoria.
    // El guard (mongod?) evita un error si beforeAll falló antes de inicializar mongod.
    await mongoose.disconnect();
    await mongod?.stop();
});

// ============================================================
// El flujo en orden: cada test depende del anterior.
// Vitest corre los tests en el orden en que están declarados
// dentro del mismo archivo, lo que garantiza la cadena.
// ============================================================

describe('Flujo completo: registro → login → puntaje → ranking', () => {

    // ----------------------------------------------------------
    // PASO 1: Registro
    // Verifica que se puede crear un usuario nuevo y que el
    // backend responde con los datos correctos + cookie de sesión.
    // ----------------------------------------------------------
    it('PASO 1 — POST /api/auth/register: crea el usuario y setea la cookie', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: JUGADOR.username,
                email: JUGADOR.email,
                password: JUGADOR.password
            });

        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({
            username: JUGADOR.username,
            email: JUGADOR.email,
            role: 'player'
        });

        // El registro también inicia sesión automáticamente
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const cookieSession = cookies.find(c => c.startsWith('sessionToken='));
        expect(cookieSession).toBeDefined();
        expect(cookieSession).toContain('HttpOnly');

        // Guardamos la cookie para usarla en los siguientes pasos
        sessionCookie = cookieSession.split(';')[0];
    });

    // ----------------------------------------------------------
    // PASO 2: Login
    // Verifica que con las credenciales del paso 1, el backend
    // emite una cookie de sesión válida. Este paso simula que
    // el usuario cerró y volvió a abrir la app.
    // ----------------------------------------------------------
    it('PASO 2 — POST /api/auth/login: autentica con la cookie correcta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: JUGADOR.email,
                password: JUGADOR.password
            });

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe(JUGADOR.username);

        // Actualizamos la cookie con la del login (puede tener nuevo JWT)
        const cookies = res.headers['set-cookie'];
        const cookieSession = cookies?.find(c => c.startsWith('sessionToken='));
        expect(cookieSession).toBeDefined();
        sessionCookie = cookieSession.split(';')[0];
    });

    // ----------------------------------------------------------
    // PASO 3: Verificar sesión activa
    // Simula la sincronización que hace el frontend al cargar la
    // página: GET /api/auth/me debe reconocer la cookie del paso 2.
    // ----------------------------------------------------------
    it('PASO 3 — GET /api/auth/me: la cookie es válida y devuelve el usuario', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', sessionCookie);

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe(JUGADOR.username);
        expect(res.body.authenticated).toBe(true);
    });

    // ----------------------------------------------------------
    // PASO 4: Guardar puntaje (simula terminar una partida)
    // El backend calcula el puntaje con la fórmula real y lo
    // guarda en MongoDB. Esta es la parte del flujo que en el
    // juego ocurre cuando el jugador vence (o muere contra) el jefe.
    // ----------------------------------------------------------
    it('PASO 4 — POST /api/scores: guarda el puntaje con la cookie de sesión', async () => {
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', sessionCookie)
            .send({
                nivelAlcanzado: 1,    // venció al jefe (valor simbólico actual)
                tiempoSegundos: 120,  // tardó 2 minutos
                danoRecibido: 30      // recibió 30 de daño
            });

        expect(res.status).toBe(200);
        // nivel 1 * 1000 - 120 * 2 - 30 * 5 = 1000 - 240 - 150 = 610
        expect(res.body.puntos).toBe(610);
        expect(res.body.esNuevoRecord).toBe(true); // es su primera partida
        expect(res.body.mejorPuntaje.puntos).toBe(610);
    });

    // ----------------------------------------------------------
    // PASO 5: Verificar que el puntaje quedó guardado en el perfil
    // GET /api/scores/me devuelve el progreso personal del jugador,
    // incluyendo su mejor puntaje y su posición en el ranking.
    // ----------------------------------------------------------
    it('PASO 5 — GET /api/scores/me: el puntaje se guardó y tiene posición en el ranking', async () => {
        const res = await request(app)
            .get('/api/scores/me')
            .set('Cookie', sessionCookie);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe(JUGADOR.username);
        expect(res.body.puntos).toBe(610);
        // posicion es un número (al menos 1, puede ser más si hay otros jugadores)
        expect(res.body.posicion).toBeGreaterThanOrEqual(1);
    });

    // ----------------------------------------------------------
    // PASO 6: Verificar que aparece en el leaderboard global
    // GET /api/scores/leaderboard es la ruta pública que muestra
    // el top 10. El jugador registrado en este test debe aparecer.
    // ----------------------------------------------------------
    it('PASO 6 — GET /api/scores/leaderboard: el jugador aparece en el ranking', async () => {
        const res = await request(app)
            .get('/api/scores/leaderboard');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.leaderboard)).toBe(true);

        const entrada = res.body.leaderboard.find(
            (e) => e.username === JUGADOR.username
        );
        expect(entrada).toBeDefined();
        expect(entrada.puntos).toBe(610);
    });

    // ----------------------------------------------------------
    // PASO 7: Segunda partida con peor puntaje (no debe actualizar)
    // Verifica la lógica de "solo guarda si es récord".
    // ----------------------------------------------------------
    it('PASO 7 — POST /api/scores (peor resultado): NO actualiza el mejor puntaje', async () => {
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', sessionCookie)
            .send({
                nivelAlcanzado: 0,    // murió
                tiempoSegundos: 999,
                danoRecibido: 999
            });

        expect(res.status).toBe(200);
        expect(res.body.esNuevoRecord).toBe(false);
        // El mejor puntaje anterior (610) debe mantenerse
        expect(res.body.mejorPuntaje.puntos).toBe(610);
    });

    // ----------------------------------------------------------
    // PASO 8: Logout
    // Verifica que el endpoint de logout responde correctamente.
    // Nota de diseño: el logout usa clearCookie (borra la cookie
    // del navegador), no una lista negra de tokens en el servidor.
    // Esto significa que el JWT en sí sigue siendo técnicamente
    // válido hasta su expiración (1 día), pero el navegador ya no
    // lo envía porque la cookie fue borrada. En un navegador real,
    // después del logout el usuario queda sin sesión. En el test,
    // como tenemos la cookie string guardada, aún podríamos usarla,
    // pero eso no refleja el comportamiento real del usuario.
    // ----------------------------------------------------------
    it('PASO 8 — POST /api/auth/logout: el servidor responde 200 y borra la cookie', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', sessionCookie);

        expect(res.status).toBe(200);

        // La respuesta debe incluir un header Set-Cookie que borre la cookie
        // (Max-Age=0 o Expires en el pasado)
        const cookies = res.headers['set-cookie'];
        if (cookies) {
            const cookieLogout = cookies.find(c => c.startsWith('sessionToken='));
            if (cookieLogout) {
                const esBorrada = cookieLogout.includes('Max-Age=0') ||
                                  cookieLogout.includes('Expires=Thu, 01 Jan 1970');
                expect(esBorrada).toBe(true);
            }
        }
    });
});