import express from 'express';
import bcrypt from 'bcrypt';
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
        const newUser = new User({
            username,
            email,
            passwordHash // Guardamos el hash, no el texto plano
        });

        await newUser.save();

        // 5. Respuesta exitosa (omitiendo información sensible)
        res.status(201).json({
            message: 'Registro completado con éxito.',
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