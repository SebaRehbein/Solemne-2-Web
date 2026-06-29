import mongoose from 'mongoose';

// Definimos el "molde" para los usuarios
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, // Es obligatorio
        unique: true,   // No pueden haber dos usuarios con el mismo nombre
        trim: true      // Borra espacios en blanco al inicio y al final
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true // Siempre lo guarda en minúsculas
    },
    passwordHash: {
        type: String,
        required: true // Guardaremos la contraseña encriptada (hash), NUNCA en texto plano
    },
    role: {
        type: String,
        enum: ['player', 'admin'], // Solo acepta estos dos valores exactos
        default: 'player'          // Si no se especifica, por defecto será un jugador
    },
    progress: {
        nivel: {
            type: Number,
            default: 1 // Nivel actual del jugador
        },
        // Guarda únicamente el mejor resultado histórico del jugador,
        // junto con los datos crudos que lo generaron.
        mejorPuntaje: {
            puntos: {
                type: Number,
                default: 0 // Mejor puntaje calculado hasta ahora
            },
            nivelAlcanzado: {
                type: Number,
                default: 0 // Nivel que alcanzó en esa mejor partida
            },
            tiempoSegundos: {
                type: Number,
                default: null // Cuánto tardó en esa mejor partida
            },
            danoRecibido: {
                type: Number,
                default: null // Cuánto daño acumuló en esa mejor partida
            },
            fecha: {
                type: Date,
                default: null // Cuándo logró ese mejor puntaje
            }
        }
    },
    // Personalización del avatar (DiceBear, estilo pixel-art).
    // Cada categoría (hair, clothes, eyes, mouth, glasses, hat, beard,
    // accessories) guarda { variant, color }. Si todo queda en null o
    // vacío (jugador que nunca personalizó nada), el avatar sigue
    // generándose solo a partir del username, igual que antes de que
    // existiera este editor. Se usa Mixed en vez de declarar cada una
    // de las 8 categorías a mano: el shape real se valida y normaliza
    // en PUT /api/avatar/config (backend/routes/avatar.js), no aquí.
    avatarConfig: {
        seed: {
            type: String,
            default: null // base aleatoria; se regenera con el botón "aleatorio" del editor
        },
        hair: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        clothes: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        eyes: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        mouth: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        glasses: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        hat: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        beard: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        accessories: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        skin: { type: mongoose.Schema.Types.Mixed, default: () => ({ variant: null, color: null }) },
        // Fecha de la última vez que se guardó una personalización. Se usa
        // como parte de la URL de la imagen del avatar (?t=<timestamp>),
        // para invalidar el cache del navegador justo cuando cambia algo,
        // sin depender de un contador en memoria (que se pierde al recargar
        // la página) ni desactivar el cache por completo.
        actualizadoEn: {
            type: Date,
            default: null
        }
    },
    createdAt: {
        type: Date,
        default: Date.now // Guarda automáticamente la fecha y hora de creación
    }
});

// Compilamos el esquema en un Modelo interactivo llamado 'User'
const User = mongoose.model('User', userSchema);

export default User;