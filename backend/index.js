import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'; // 1. Importamos mongoose

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; // 2. Traemos la URI del archivo .env

// Configuración de Middlewares
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// --- CONEXIÓN A MONGODB --- //
// 3. Conectamos a la base de datos usando promesas
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('📦 Conectado exitosamente a MongoDB');
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