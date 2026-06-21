import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // 1. Importamos la librería

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
// 2. Modificamos CORS para permitir credenciales (cookies)
app.use(cors({
    origin: 'http://localhost:5173', // URL exacta de tu frontend (Vite usa el 5173 por defecto)
    credentials: true // ¡ESTO ES OBLIGATORIO PARA USAR COOKIES CROSS-ORIGIN!
}));

app.use(express.json());
app.use(cookieParser()); // 3. Le decimos a Express que parsee las cookies entrantes

// Rutas base
app.get('/', (req, res) => {
    res.status(200).json({ status: 'Operativo', message: 'El servidor backend está funcionando correctamente.' });
});

// --- RUTAS DE PRUEBA PARA TUS COOKIES ---

// Ruta para CREAR una cookie y enviarla al navegador
app.get('/crear-cookie', (req, res) => {
    // res.cookie('nombre', 'valor', opciones)
    res.cookie('token_sesion', 'super_secreto_123', {
        httpOnly: true, // El JavaScript del navegador (tu frontend) NO puede leerla
        secure: process.env.NODE_ENV === 'production', // true solo si usas HTTPS (producción)
        sameSite: 'strict', // Medida extra de seguridad contra ataques CSRF
        maxAge: 1000 * 60 * 60 * 24 // Tiempo de vida: 1 día (en milisegundos)
    });
    
    res.json({ message: 'Cookie httpOnly entregada al navegador con éxito.' });
});

// Ruta para LEER la cookie que el navegador nos envía de vuelta
app.get('/leer-cookie', (req, res) => {
    // Gracias a cookie-parser, las cookies vienen listas en req.cookies
    const miToken = req.cookies.token_sesion;
    
    if (miToken) {
        res.json({ message: '¡Cookie recibida!', token: miToken });
    } else {
        res.status(401).json({ message: 'No tienes autorización (No hay cookie)' });
    }
});

// Inicialización del proceso de escucha
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});