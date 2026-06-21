import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json());

// Definición de rutas base
app.get('/', (req, res) => {
    res.status(200).json({ status: 'En linea', message: 'El servidor backend está funcionando correctamente.' });
});

// Inicialización del proceso de escucha
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});