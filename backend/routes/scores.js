import express from 'express';
import User from '../models/User.js';
import { verifyPlayer } from '../middlewares/authMiddleware.js';
import { calcularPuntaje } from '../utils/calcularPuntaje.js';

const router = express.Router();

// Valida que un valor sea un número finito y no negativo
const esNumeroValido = (valor) =>
    typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;

// ==========================================
// POST /api/scores
// Guarda el puntaje al terminar una partida.
// Protegido con verifyPlayer: lee el usuario desde la cookie.
// ==========================================
router.post('/', verifyPlayer, async (req, res) => {
    try {
        const { nivelAlcanzado, tiempoSegundos, danoRecibido } = req.body;

        if (
            !esNumeroValido(nivelAlcanzado) ||
            !esNumeroValido(tiempoSegundos) ||
            !esNumeroValido(danoRecibido)
        ) {
            return res.status(400).json({
                message: 'nivelAlcanzado, tiempoSegundos y danoRecibido deben ser números válidos y no negativos.'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'El usuario ya no existe en el sistema.' });
        }

        // Cálculo del puntaje (fórmula centralizada, el frontend nunca decide este número)
        const puntos = calcularPuntaje({ nivelAlcanzado, tiempoSegundos, danoRecibido });

        // El nivel actual siempre refleja la partida más reciente
        user.progress.nivel = nivelAlcanzado;

        // El mejor puntaje solo se actualiza si es superado
        const esNuevoRecord = puntos > user.progress.mejorPuntaje.puntos;
        if (esNuevoRecord) {
            user.progress.mejorPuntaje = {
                puntos,
                nivelAlcanzado,
                tiempoSegundos,
                danoRecibido,
                fecha: new Date()
            };
        }

        await user.save();

        return res.status(200).json({
            puntos,
            esNuevoRecord,
            mejorPuntaje: user.progress.mejorPuntaje
        });

    } catch (error) {
        console.error('Error crítico en POST /api/scores:', error);
        return res.status(500).json({ message: 'Error interno del servidor al guardar el puntaje.' });
    }
});

// ==========================================
// GET /api/scores/leaderboard
// Top 10 puntajes globales. Ruta pública: no requiere sesión.
// ==========================================
router.get('/leaderboard', async (req, res) => {
    try {
        const top10 = await User.find({
            role: 'player',
            'progress.mejorPuntaje.puntos': { $gt: 0 }
        })
            .select('username progress.mejorPuntaje')
            .sort({ 'progress.mejorPuntaje.puntos': -1 })
            .limit(10);

        return res.status(200).json({
            leaderboard: top10.map((user) => ({
                username: user.username,
                puntos: user.progress.mejorPuntaje.puntos,
                nivelAlcanzado: user.progress.mejorPuntaje.nivelAlcanzado,
                fecha: user.progress.mejorPuntaje.fecha
            }))
        });

    } catch (error) {
        console.error('Error crítico en GET /api/scores/leaderboard:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener el leaderboard.' });
    }
});

export default router;