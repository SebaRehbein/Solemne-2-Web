// ==========================================================
// tests/adminAuth.routes.test.js
//
// Tests de la ruta POST /api/admin/login.
//
// A diferencia del login de jugador (que usa cookies httpOnly),
// el admin recibe el JWT directamente en el BODY de la respuesta.
// El frontend del panel admin lo guarda en localStorage y lo adjunta
// manualmente en cada petición como header Authorization: Bearer <token>.
// ==========================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

vi.mock('../models/User.js', () => {
    const UserMock = vi.fn();
    UserMock.findOne = vi.fn();
    return { default: UserMock };
});

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn()
    }
}));

import User from '../models/User.js';
import bcrypt from 'bcrypt';
import adminAuthRoutes from '../routes/adminAuth.js';

const ADMIN_JWT_SECRET = 'test_jwt_secret_admin';
const COOKIE_SECRET = 'test_cookie_secret';

function crearApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser(COOKIE_SECRET));
    app.use('/api/admin', adminAuthRoutes);
    return app;
}

describe('POST /api/admin/login', () => {
    const adminFake = {
        _id: 'admin_id_fake_456',
        username: 'SuperAdmin',
        email: 'superadmin@berrybadluck.com',
        passwordHash: 'hash_admin_guardado',
        role: 'admin'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        User.findOne.mockResolvedValue(adminFake);
        bcrypt.compare.mockResolvedValue(true);
    });

    it('responde 200 y devuelve el JWT en el body (no en cookie)', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'superadmin@berrybadluck.com', password: 'admin123' });

        expect(res.status).toBe(200);

        // El token debe venir en el BODY, no en una cookie
        expect(res.body.token).toBeDefined();

        // La respuesta NO debe setear la cookie sessionToken
        const cookies = res.headers['set-cookie'];
        const tieneSessionCookie = cookies?.some(c => c.startsWith('sessionToken='));
        expect(tieneSessionCookie).toBeFalsy();

        // El token debe ser un JWT válido firmado con ADMIN_JWT_SECRET
        const decoded = jwt.verify(res.body.token, ADMIN_JWT_SECRET);
        expect(decoded.role).toBe('admin');
    });

    it('responde 401 si el role del usuario NO es admin', async () => {
        // Un jugador normal intentando loguearse como admin
        User.findOne.mockResolvedValue({
            ...adminFake,
            role: 'player' // jugador, no admin
        });

        const app = crearApp();
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'jugador@test.com', password: 'pass123' });

        expect(res.status).toBe(401);
        expect(res.body.token).toBeUndefined();
    });

    it('responde 401 si la contraseña es incorrecta', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const app = crearApp();
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'superadmin@berrybadluck.com', password: 'password_incorrecta' });

        expect(res.status).toBe(401);
        expect(res.body.token).toBeUndefined();
    });

    it('responde 401 si el usuario no existe', async () => {
        User.findOne.mockResolvedValue(null);

        const app = crearApp();
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'noexiste@test.com', password: 'pass123' });

        expect(res.status).toBe(401);
    });

    it('responde 400 si faltan email o password', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'superadmin@berrybadluck.com' }); // sin password

        expect(res.status).toBe(400);
    });
});