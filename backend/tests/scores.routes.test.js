// ==========================================================
// tests/scores.routes.test.js
//
// Tests de la ruta POST /api/scores.
//
// Esta ruta está protegida con verifyPlayer, por lo que hay dos
// familias de tests:
//   1. Sin cookie válida → debe rechazar con 401
//   2. Con cookie válida → debe procesar y guardar el puntaje
//
// El caso 2 también prueba la lógica de "solo actualiza si es récord"
// y la validación de los datos de entrada.
// ==========================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

vi.mock('../models/User.js', () => {
    const UserMock = vi.fn();
    UserMock.findById = vi.fn();
    return { default: UserMock };
});

import User from '../models/User.js';
import scoresRoutes from '../routes/scores.js';

const JWT_SECRET = 'test_jwt_secret_jugador';
const COOKIE_SECRET = 'test_cookie_secret';

function crearApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser(COOKIE_SECRET));
    app.use('/api/scores', scoresRoutes);
    return app;
}

// Genera una cookie sessionToken firmada con COOKIE_SECRET, tal como
// lo hace auth.js con res.cookie('sessionToken', token, { signed: true })
function generarCookieValida(payload = { id: 'user123', role: 'player' }) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    // cookie-parser firma como: s:<valor>.<hmac-base64>
    // Supertest necesita la cookie firmada en el formato correcto
    // Usamos el módulo interno de cookie-signature que usa cookie-parser
    const cookieSignature = require('cookie-signature');
    const signed = 's:' + cookieSignature.sign(token, COOKIE_SECRET);
    return `sessionToken=${encodeURIComponent(signed)}`;
}

// Usuario fake con progreso existente para las pruebas
function crearUsuarioFake(mejorPuntajeActual = 0) {
    return {
        _id: 'user123',
        progress: {
            nivel: 1,
            mejorPuntaje: {
                puntos: mejorPuntajeActual,
                nivelAlcanzado: 0,
                tiempoSegundos: null,
                danoRecibido: null,
                fecha: null
            }
        },
        save: vi.fn().mockResolvedValue(true)
    };
}

describe('POST /api/scores — sin autenticación', () => {
    it('devuelve 401 si no hay cookie sessionToken', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .send({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 10 });

        expect(res.status).toBe(401);
    });

    it('devuelve 401 si la cookie es inválida (token firmado con secreto incorrecto)', async () => {
        // Firma con un secreto diferente al que espera el servidor
        const tokenFalso = jwt.sign({ id: 'user123', role: 'player' }, 'secreto_incorrecto');

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', `sessionToken=${tokenFalso}`) // sin firmar correctamente
            .send({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 10 });

        expect(res.status).toBe(401);
    });
});

describe('POST /api/scores — con autenticación válida', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devuelve 400 si los datos de la partida son inválidos (negativos)', async () => {
        const usuarioFake = crearUsuarioFake(0);
        User.findById.mockResolvedValue(usuarioFake);

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', generarCookieValida())
            .send({ nivelAlcanzado: -1, tiempoSegundos: 60, danoRecibido: 10 }); // negativo

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('válidos');
    });

    it('devuelve 400 si faltan campos de la partida', async () => {
        const usuarioFake = crearUsuarioFake(0);
        User.findById.mockResolvedValue(usuarioFake);

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', generarCookieValida())
            .send({ nivelAlcanzado: 1 }); // sin tiempoSegundos ni danoRecibido

        expect(res.status).toBe(400);
    });

    it('guarda el puntaje y responde esNuevoRecord: true si supera el anterior', async () => {
        const usuarioFake = crearUsuarioFake(100); // puntaje anterior bajo
        User.findById.mockResolvedValue(usuarioFake);

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', generarCookieValida())
            // nivel 1 * 1000 - 30*2 - 10*5 = 1000 - 60 - 50 = 890 > 100
            .send({ nivelAlcanzado: 1, tiempoSegundos: 30, danoRecibido: 10 });

        expect(res.status).toBe(200);
        expect(res.body.esNuevoRecord).toBe(true);
        expect(res.body.puntos).toBe(890);
        // Debe haber llamado save() para persistir el nuevo récord
        expect(usuarioFake.save).toHaveBeenCalledOnce();
    });

    it('NO actualiza mejorPuntaje si el nuevo puntaje es menor al anterior', async () => {
        const usuarioFake = crearUsuarioFake(5000); // récord muy alto
        User.findById.mockResolvedValue(usuarioFake);

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', generarCookieValida())
            .send({ nivelAlcanzado: 0, tiempoSegundos: 999, danoRecibido: 999 });

        expect(res.status).toBe(200);
        expect(res.body.esNuevoRecord).toBe(false);
        // El puntaje calculado (0) no supera el anterior (5000)
        expect(res.body.puntos).toBe(0);
        // save() sigue llamándose porque igual actualiza progress.nivel
        expect(usuarioFake.save).toHaveBeenCalledOnce();
    });

    it('devuelve 404 si el usuario ya no existe en la BD', async () => {
        User.findById.mockResolvedValue(null); // usuario borrado

        const app = crearApp();
        const res = await request(app)
            .post('/api/scores')
            .set('Cookie', generarCookieValida())
            .send({ nivelAlcanzado: 1, tiempoSegundos: 60, danoRecibido: 10 });

        expect(res.status).toBe(404);
    });
});