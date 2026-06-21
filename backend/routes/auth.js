import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Los campos username, email y password son obligatorios.' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });

        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya se encuentra en uso.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            passwordHash
        });

        await newUser.save();

        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
        const payload = {
            id: newUser._id,
            role: newUser.role
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

        // Nota: Cambiado a 'sessionToken' para mantener consistencia con el login
        res.cookie('sessionToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24
        });

        res.status(201).json({
            message: 'Registro completado con éxito. Sesión iniciada automáticamente.',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Error crítico en el endpoint de registro:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

// ==========================================
// NUEVO: POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validación de campos obligatorios
        if (!email || !password) {
            return res.status(400).json({ message: 'Los campos email y password son obligatorios.' });
        }

        // 2. Buscar al usuario por correo electrónico
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Por seguridad, si el usuario no existe usamos un mensaje genérico
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Comparar la contraseña ingresada con el hash de la base de datos
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Generación del JSON Web Token (JWT)
        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
        const payload = {
            id: user._id,
            role: user.role // Aquí viajará el rol del usuario ('player' o 'admin')
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

        // 5. Configurar la cookie httpOnly con el nombre 'sessionToken'
        res.cookie('sessionToken', token, {
            httpOnly: true, // Protege contra vulnerabilidades XSS
            secure: process.env.NODE_ENV === 'production', // True solo bajo HTTPS en producción
            sameSite: 'strict', // Protege contra ataques CSRF
            maxAge: 1000 * 60 * 60 * 24 // Duración de 1 día
        });

        // 6. Enviar respuesta exitosa sin datos sensibles
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error crítico en el endpoint de login:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
    }
});

export default router;