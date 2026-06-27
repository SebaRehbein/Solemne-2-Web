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
    createdAt: {
        type: Date,
        default: Date.now // Guarda automáticamente la fecha y hora de creación
    }
});

// Compilamos el esquema en un Modelo interactivo llamado 'User'
const User = mongoose.model('User', userSchema);

export default User;