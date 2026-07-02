// ==========================================================
// app.js — Configura y exporta la app de Express.
//
// Separado de index.js intencionalmente:
// - index.js  → conecta MongoDB, crea usuarios de prueba, levanta el servidor
// - app.js    → solo middlewares + rutas (sin MongoDB, sin listen)
//
// Esta separación permite que los tests de integración importen
// la app y la usen con su propia conexión a MongoDB de test,
// sin mezclarla con la base de datos real de desarrollo.
// ==========================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import cookieRoutes from './routes/cookieRoutes.js';
import scoresRoutes from './routes/scores.js';
import avatarRoutes from './routes/avatar.js';
import { COOKIE_SECRET } from './config/jwt.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/cookies', cookieRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/avatar', avatarRoutes);

export default app;