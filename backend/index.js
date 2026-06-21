import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; 
import User from './models/User.js'; // <-- 1. NUEVO: Importamos nuestro modelo de Usuario

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; 

// Configuración de Middlewares
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// --- CONEXIÓN A MONGODB --- //
// 2. NUEVO: Agregamos 'async' para poder usar 'await' al guardar los usuarios
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('📦 Conectado exitosamente a MongoDB');

        // --- 3. NUEVO: CÓDIGO DE PRUEBA PARA CREAR USUARIOS ---
        try {
            // Verificamos si ya existe el admin para no crearlo duplicado
            const adminExists = await User.findOne({ email: 'admin@berrybadluck.com' });
            
            if (!adminExists) {
                // Creamos un Administrador
                await User.create({
                    username: 'AdminPrueba',
                    email: 'admin@berrybadluck.com',
                    passwordHash: 'hash_falso_admin_123',
                    role: 'admin'
                });

                // Creamos un Jugador con progreso
                await User.create({
                    username: 'JugadorShuri',
                    email: 'shuri@berrybadluck.com',
                    passwordHash: 'hash_falso_jugador_123',
                    role: 'player',
                    progress: { nivel: 3, puntaje: 1500 },
                    scores: [500, 1000, 1500]
                });

                console.log('👤 ¡Usuarios de prueba creados en la base de datos!');
            } else {
                console.log('👤 Los usuarios de prueba ya existían.');
            }
        } catch (err) {
            console.error('❌ Error al crear usuarios de prueba:', err);
        }
        // ------------------------------------------------------
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MongoDB:', error);
    });
// ------------------------- //

// Rutas base
app.get('/', (req, res) => {
    res.status(200).json({ status: 'Operativo', message: 'El servidor backend está funcionando correctamente.' });
});

// Rutas de prueba de cookies (mantienes las que ya tenías)
app.get('/crear-cookie', (req, res) => {
    res.cookie('token_sesion', 'super_secreto_123', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 
    });
    res.json({ message: 'Cookie httpOnly entregada al navegador con éxito.' });
});

app.get('/leer-cookie', (req, res) => {
    const miToken = req.cookies.token_sesion;
    if (miToken) {
        res.json({ message: '¡Cookie recibida!', token: miToken });
    } else {
        res.status(401).json({ message: 'No tienes autorización (No hay cookie)' });
    }
});

// Inicialización del proceso de escucha
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});