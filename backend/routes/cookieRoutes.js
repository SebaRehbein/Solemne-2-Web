import express from 'express';

const router = express.Router();

// Ruta para crear la cookie
router.get('/crear-cookie', (req, res) => {
    res.cookie('token_sesion', 'super_secreto_123', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 
    });
    res.json({ message: 'Cookie httpOnly entregada al navegador con éxito desde el Router.' });
});

// Ruta para leer la cookie
router.get('/leer-cookie', (req, res) => {
    const miToken = req.cookies.token_sesion;
    if (miToken) {
        res.json({ message: '¡Cookie recibida en el Router!', token: miToken });
    } else {
        res.status(401).json({ message: 'No tienes autorización (No hay cookie en el Router)' });
    }
});

// Exportamos el router para que index.js pueda usarlo
export default router;