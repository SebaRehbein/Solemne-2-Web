import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; 
import bcrypt from 'bcrypt';
import User from './models/User.js'; 
import authRoutes from './routes/auth.js'; 
import adminAuthRoutes from './routes/adminAuth.js'; 

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

// --- RUTAS DE LA API --- //
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminAuthRoutes); // <-- Rutas de autenticación de administradores

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
                    progress: { nivel: 3, puntaje: 1500 },
                    scores: [500, 1000, 1500]
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