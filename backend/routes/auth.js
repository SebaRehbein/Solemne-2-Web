import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // <-- NUEVO: Importamos jsonwebtoken
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Validación de entrada
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Los campos username, email y password son obligatorios.' });
        }

        // 2. Verificación de duplicados en la base de datos
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });

        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya se encuentra en uso.' });
        }

        // 3. Generación del hash criptográfico
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Instanciación del modelo y guardado
        // El rol será 'player' por defecto gracias a tu esquema en User.js
        const newUser = new User({
            username,
            email,
            passwordHash
        });

        await newUser.save();

        // 5. NUEVO: Generación del JSON Web Token (JWT)
        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo'; // Idealmente usa la de tu .env
        
        // Creamos el payload con datos no sensibles que nos servirán después
        const payload = {
            id: newUser._id,
            role: newUser.role // Aquí viajará 'player'
        };

        // Firmamos el token, dándole una expiración (ej. 1 día)
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

        // 6. NUEVO: Configuración de la cookie httpOnly
        res.cookie('token_sesion', token, {
            httpOnly: true, // Previene ataques XSS (no se lee desde JS del navegador)
            secure: process.env.NODE_ENV === 'production', // True solo en producción (https)
            sameSite: 'strict', // Previene ataques CSRF
            maxAge: 1000 * 60 * 60 * 24 // Expira en 1 día (igual que el token)
        });

        // 7. Respuesta exitosa (omitiendo información sensible)
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

export default router;