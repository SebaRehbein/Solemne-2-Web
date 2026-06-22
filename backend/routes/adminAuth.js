import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js'; // <-- NUEVO: Importamos el middleware de admin

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

        // 4. Generar el JWT
        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
        const payload = {
            id: user._id,
            role: user.role
        };

        // El token para administradores suele tener una expiración más corta por seguridad
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '4h' });

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

export default router;