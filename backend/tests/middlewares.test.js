// ==========================================================
// tests/middlewares.test.js
//
// Tests UNITARIOS de verifyPlayer y verifyAdmin.
//
// Qué es un "mock" aquí: en vez de tener un objeto req/res real de
// Express (que requeriría un servidor corriendo), creamos objetos
// simulados que tienen exactamente las propiedades que el middleware
// necesita leer. Esto nos permite probar la lógica del middleware
// en completo aislamiento, sin ninguna dependencia externa.
// ==========================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyPlayer, verifyAdmin } from '../middlewares/authMiddleware.js';

// Secretos de test definidos en setup.js
const JWT_SECRET = 'test_jwt_secret_jugador';
const ADMIN_JWT_SECRET = 'test_jwt_secret_admin';
const COOKIE_SECRET = 'test_cookie_secret';

// Helper para construir el valor de una cookie firmada manualmente,
// igual a como lo hace cookie-parser cuando se usa cookieParser(COOKIE_SECRET).
// Formato interno de cookie-parser: "s:<valor>.<firma_hmac>"
function firmarCookie(valor, secret) {
    const { createHmac } = require('crypto');
    const firma = createHmac('sha256', secret)
        .update(valor)
        .digest('base64')
        .replace(/=+$/, '');
    return `${valor}.${firma}`;
}

// Helper para crear mocks de req, res y next reutilizables en cada test
function crearMocks({ signedCookies = {}, headers = {} } = {}) {
    const req = {
        signedCookies,
        headers,
        user: undefined
    };

    const res = {
        status: vi.fn().mockReturnThis(), // .mockReturnThis() permite encadenar .json()
        json: vi.fn()
    };

    const next = vi.fn();

    return { req, res, next };
}

// ============================================================
// verifyPlayer
// ============================================================
describe('verifyPlayer', () => {
    it('llama next() si la cookie sessionToken es válida', () => {
        const payload = { id: 'user123', role: 'player' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        const { req, res, next } = crearMocks({
            signedCookies: { sessionToken: token }
        });

        verifyPlayer(req, res, next);

        // El middleware debe llamar next() para pasar al siguiente handler
        expect(next).toHaveBeenCalledOnce();
        // Y debe haber inyectado req.user con los datos del token
        expect(req.user).toMatchObject({ id: 'user123', role: 'player' });
        // No debe haber respondido con error
        expect(res.status).not.toHaveBeenCalled();
    });

    it('devuelve 401 si no hay cookie sessionToken', () => {
        const { req, res, next } = crearMocks({
            signedCookies: {} // sin cookie
        });

        verifyPlayer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.any(String) })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si la cookie está firmada con un secreto incorrecto', () => {
        // Firma el token con un secreto distinto al que usa el middleware
        const token = jwt.sign({ id: 'user123', role: 'player' }, 'secreto_incorrecto');

        const { req, res, next } = crearMocks({
            signedCookies: { sessionToken: token }
        });

        verifyPlayer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si el token está expirado', () => {
        // expiresIn: '0s' crea un token que ya expiró al crearse
        const token = jwt.sign({ id: 'user123', role: 'player' }, JWT_SECRET, { expiresIn: '0s' });

        const { req, res, next } = crearMocks({
            signedCookies: { sessionToken: token }
        });

        verifyPlayer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si la cookie es false (manipulada, firma inválida según cookie-parser)', () => {
        // cookie-parser pone false cuando la firma de la cookie no coincide
        const { req, res, next } = crearMocks({
            signedCookies: { sessionToken: false }
        });

        verifyPlayer(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ============================================================
// verifyAdmin
// ============================================================
describe('verifyAdmin', () => {
    it('llama next() si el header Authorization tiene un token de admin válido', () => {
        const payload = { id: 'admin123', role: 'admin' };
        const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '4h' });

        const { req, res, next } = crearMocks({
            headers: { authorization: `Bearer ${token}` }
        });

        verifyAdmin(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.user).toMatchObject({ id: 'admin123', role: 'admin' });
        expect(res.status).not.toHaveBeenCalled();
    });

    it('devuelve 401 si no hay header Authorization', () => {
        const { req, res, next } = crearMocks({
            headers: {} // sin header
        });

        verifyAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si el header no empieza con Bearer', () => {
        const token = jwt.sign({ id: 'admin123', role: 'admin' }, ADMIN_JWT_SECRET);

        const { req, res, next } = crearMocks({
            headers: { authorization: `Token ${token}` } // formato incorrecto
        });

        verifyAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 403 si el token es válido pero el role NO es admin', () => {
        // Un token de jugador (firmado con JWT_SECRET del jugador) no debería
        // poder pasar verifyAdmin aunque el role dijera 'admin' — pero aquí
        // probamos el caso donde el secreto sí es el de admin pero role != admin
        const token = jwt.sign({ id: 'user123', role: 'player' }, ADMIN_JWT_SECRET);

        const { req, res, next } = crearMocks({
            headers: { authorization: `Bearer ${token}` }
        });

        verifyAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si el token de admin está firmado con el secreto del jugador', () => {
        // Defensa en profundidad: un token de jugador nunca puede pasar verifyAdmin
        // porque usa JWT_SECRET, pero verifyAdmin verifica con ADMIN_JWT_SECRET
        const token = jwt.sign({ id: 'user123', role: 'admin' }, JWT_SECRET);

        const { req, res, next } = crearMocks({
            headers: { authorization: `Bearer ${token}` }
        });

        verifyAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('devuelve 401 si el token de admin está expirado', () => {
        const token = jwt.sign({ id: 'admin123', role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '0s' });

        const { req, res, next } = crearMocks({
            headers: { authorization: `Bearer ${token}` }
        });

        verifyAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});