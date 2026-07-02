// dotenv/config ejecuta dotenv.config() automáticamente al importarse.
// Tiene que ser el PRIMER import del archivo, sin nada antes: en ES
// modules, todos los imports se cargan en un recorrido depth-first
// ANTES de ejecutar cualquier código del archivo (incluida una llamada
// a dotenv.config() escrita en la línea siguiente) — así que escribir
// "import dotenv from 'dotenv'; dotenv.config();" arriba de los demás
// imports NO alcanza para garantizar el orden. Ver:
// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; 
import bcrypt from 'bcrypt';
import User from './models/User.js'; 
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import scoresRoutes from './routes/scores.js';
import avatarRoutes from './routes/avatar.js';
import { COOKIE_SECRET } from './config/jwt.js';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; 

// Configuración de Middlewares
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(express.json());
// cookieParser(COOKIE_SECRET) firma las cookies que se setean con
// { signed: true }: el navegador no puede modificar su contenido sin
// invalidar la firma. Esto es una capa adicional, independiente de que
// el propio valor de la cookie (el JWT) ya esté firmado por su cuenta.
app.use(cookieParser(COOKIE_SECRET));

// --- RUTAS DE LA API --- //
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes); // <-- Rutas de autenticación de administradores
app.use('/api/scores', scoresRoutes); // <-- Puntajes, leaderboard y progreso del jugador
app.use('/api/avatar', avatarRoutes); // <-- Avatares generados via DiceBear (API externa)

// --- CONEXIÓN A MONGODB --- //
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('📦 Conectado exitosamente a MongoDB');

        // --- CÓDIGO DE PRUEBA ACTUALIZADO PARA CREAR ADMIN REAL ---
        try {
            const superAdminExists = await User.findOne({ email: 'superadmin@berrybadluck.com' });
            
            if (!superAdminExists) {
                // Generamos un hash real para la contraseña "admin123"
                const hashedAdminPassword = await bcrypt.hash('admin123', 10);

                // Creamos un Administrador con el hash correcto
                await User.create({
                    username: 'SuperAdmin',
                    email: 'superadmin@berrybadluck.com',
                    passwordHash: hashedAdminPassword,
                    role: 'admin'
                });
                console.log('👑 SuperAdmin de prueba creado con éxito!');
            } else {
                console.log('👑 El SuperAdmin de prueba ya existe.');
            }

            // Mantenemos al jugador de prueba por si necesitas hacer pruebas con su progreso
            const shuriExists = await User.findOne({ email: 'shuri@berrybadluck.com' });
            if (!shuriExists) {
                await User.create({
                    username: 'JugadorShuri',
                    email: 'shuri@berrybadluck.com',
                    passwordHash: 'hash_falso_jugador_123', // Este no se puede loguear porque el hash es falso
                    role: 'player',
                    progress: {
                        nivel: 3,
                        mejorPuntaje: {
                            puntos: 1500,
                            nivelAlcanzado: 3,
                            tiempoSegundos: 180,
                            danoRecibido: 40,
                            fecha: new Date()
                        }
                    }
                });
                console.log('🐶 Jugador Shuri creado de prueba.');
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

// Inicialización del proceso de escucha
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});