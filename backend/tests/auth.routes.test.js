// ==========================================================
// tests/auth.routes.test.js
//
// Tests de INTEGRACIÓN de las rutas de autenticación de jugador:
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/logout
//
// Usa supertest para hacer peticiones HTTP reales a la app de Express
// (sin levantar un servidor en un puerto), y vi.mock para reemplazar
// User (Mongoose) y bcrypt con versiones falsas que devuelven datos
// controlados — sin necesidad de una base de datos real.
//
// Esto es lo que tu profesor mencionó como "mocks para las bases de datos".
// ==========================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock de User ANTES de importar las rutas que lo usan
vi.mock('../models/User.js', () => {
    // Crea una clase mock que se comporta como el modelo Mongoose
    const UserMock = vi.fn(function(data) {
        Object.assign(this, data);
        this._id = 'user_id_fake_123';
        this.role = 'player';
        this.save = vi.fn().mockResolvedValue(true);
    });
    UserMock.findOne = vi.fn();
    return { default: UserMock };
});

// Mock de bcrypt para no hacer operaciones criptográficas reales (son lentas)
vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hash_falso_bcrypt'),
        compare: vi.fn()
    }
}));

import User from '../models/User.js';
import bcrypt from 'bcrypt';
import authRoutes from '../routes/auth.js';

const COOKIE_SECRET = 'test_cookie_secret';

// Construye una app Express mínima con las mismas configuraciones que index.js
// pero sin levantar un servidor real ni conectarse a MongoDB
function crearApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser(COOKIE_SECRET)); // mismo secreto que el setup.js
    app.use('/api/auth', authRoutes);
    return app;
}

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Por defecto: el usuario no existe todavía
        User.findOne.mockResolvedValue(null);
    });

    it('responde 201 y setea cookie sessionToken al registrarse exitosamente', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'NuevoJugador', email: 'nuevo@test.com', password: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({
            username: 'NuevoJugador',
            email: 'nuevo@test.com',
            role: 'player'
        });

        // Verifica que se setea la cookie httpOnly firmada
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const cookieSession = cookies.find(c => c.startsWith('sessionToken='));
        expect(cookieSession).toBeDefined();
        expect(cookieSession).toContain('HttpOnly');
        expect(cookieSession).toContain('SameSite=Strict');
    });

    it('responde 400 si faltan campos obligatorios', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'Solo' }); // sin email ni password

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('obligatorios');
    });

    it('responde 409 si el usuario o email ya existe', async () => {
        // Simula que ya existe un usuario con ese email/username
        User.findOne.mockResolvedValue({ _id: 'existing_id', username: 'YaExiste' });

        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'YaExiste', email: 'ya@test.com', password: 'pass123' });

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('ya se encuentra en uso');
    });
});

describe('POST /api/auth/login', () => {
    const usuarioFake = {
        _id: 'user_id_fake_123',
        username: 'JugadorExistente',
        email: 'jugador@test.com',
        passwordHash: 'hash_guardado',
        role: 'player'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        User.findOne.mockResolvedValue(usuarioFake);
        bcrypt.compare.mockResolvedValue(true); // contraseña correcta por defecto
    });

    it('responde 200 y setea cookie sessionToken con credenciales correctas', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jugador@test.com', password: 'pass123' });

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ username: 'JugadorExistente', role: 'player' });

        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const cookieSession = cookies.find(c => c.startsWith('sessionToken='));
        expect(cookieSession).toBeDefined();
        expect(cookieSession).toContain('HttpOnly');
    });

    it('responde 401 si la contraseña es incorrecta', async () => {
        bcrypt.compare.mockResolvedValue(false); // contraseña incorrecta

        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jugador@test.com', password: 'password_incorrecta' });

        expect(res.status).toBe(401);
        // No debe setear ninguna cookie de sesión
        const cookies = res.headers['set-cookie'];
        expect(cookies?.some(c => c.startsWith('sessionToken='))).toBeFalsy();
    });

    it('responde 401 si el usuario no existe', async () => {
        User.findOne.mockResolvedValue(null); // no existe

        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@test.com', password: 'pass123' });

        expect(res.status).toBe(401);
    });

    it('responde 400 si faltan email o password', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jugador@test.com' }); // sin password

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/logout', () => {
    it('responde 200 y borra la cookie sessionToken', async () => {
        const app = crearApp();
        const res = await request(app)
            .post('/api/auth/logout');

        expect(res.status).toBe(200);

        // Después del logout, la cookie debe enviarse con Max-Age=0 o Expires en el pasado
        const cookies = res.headers['set-cookie'];
        if (cookies) {
            const cookieSession = cookies.find(c => c.startsWith('sessionToken='));
            if (cookieSession) {
                const tieneExpiracion = cookieSession.includes('Expires=') ||
                                        cookieSession.includes('Max-Age=0');
                expect(tieneExpiracion).toBe(true);
            }
        }
    });
});