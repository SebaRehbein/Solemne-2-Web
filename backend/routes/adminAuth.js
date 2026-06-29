import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js'; // <-- NUEVO: Importamos el middleware de admin
import { ADMIN_JWT_SECRET } from '../config/jwt.js';

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validación básica
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }

        // 2. Buscar al usuario y verificar estrictamente que su rol sea 'admin'
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Credenciales inválidas o acceso denegado.' });
        }

        // 3. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Generar el JWT con el secreto EXCLUSIVO de admin (distinto
        // al de jugador: ver config/jwt.js). Defensa en profundidad: un
        // token de jugador nunca podría validarse como admin, ni
        // viceversa, aunque alguien manipulara el campo role a mano.
        const payload = {
            id: user._id,
            role: user.role
        };

        // El token para administradores suele tener una expiración más corta por seguridad
        const token = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '4h' });

        // 5. Enviar respuesta: OJO, aquí NO usamos res.cookie
        // Devolvemos el token directamente en el JSON para que el frontend lo guarde
        return res.status(200).json({
            message: 'Inicio de sesión de administrador exitoso.',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error crítico en el login de administrador:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ==========================================================
// NUEVO: GET /api/admin/me
// Endpoint protegido para obtener el perfil del administrador
// ==========================================================
router.get('/me', verifyAdmin, async (req, res) => {
    try {
        // Buscamos al administrador en la base de datos usando el ID inyectado por el middleware
        // .select('-passwordHash') asegura que el hash de la contraseña nunca viaje al cliente
        const admin = await User.findById(req.user.id).select('-passwordHash');

        if (!admin) {
            return res.status(404).json({ message: 'El administrador ya no existe.' });
        }

        return res.status(200).json({
            authenticated: true,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Error en GET /admin/me:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ==========================================================
// GET /api/admin/users
// Endpoint protegido para listar todos los jugadores
// ==========================================================
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        // Se filtran los documentos para obtener únicamente aquellos con rol 'player'
        // Se excluye passwordHash para evitar la exposición de datos críticos en la respuesta
        const players = await User.find({ role: 'player' }).select('-passwordHash');

        if (!players || players.length === 0) {
            return res.status(404).json({ message: 'No se encontraron jugadores registrados.' });
        }

        return res.status(200).json({
            message: 'Listado de jugadores obtenido exitosamente.',
            total: players.length,
            players: players
        });
    } catch (error) {
        console.error('Error crítico en GET /admin/users:', error);
        return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
    }
});

export default router;