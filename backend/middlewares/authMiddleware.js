import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_JWT_SECRET } from '../config/jwt.js';

// ==========================================================
// Middleware para verificar jugadores (Cookies httpOnly)
// ==========================================================
export const verifyPlayer = (req, res, next) => {
    try {
        // 1. Extraer el token de las cookies firmadas (signedCookies, no
        // cookies: la cookie se setea con signed:true en routes/auth.js,
        // así que solo es válida si pasa la verificación de firma de
        // cookie-parser con COOKIE_SECRET, ver index.js)
        const token = req.signedCookies.sessionToken;

        // 2. Si no hay token, rechazamos la petición
        if (!token) {
            return res.status(401).json({ 
                message: 'Acceso denegado. No se encontró un token de sesión.' 
            });
        }

        // 3. Verificar el token con nuestra clave secreta
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Inyectamos los datos descifrados (id, role) en el objeto 'req'
        req.user = decoded;

        // 5. Todo está correcto, pasamos el control a la siguiente función
        next();

    } catch (error) {
        return res.status(401).json({ 
            message: 'Token inválido o expirado. Inicia sesión nuevamente.' 
        });
    }
};

// ==========================================================
// NUEVO: Middleware para verificar administradores (Headers)
// ==========================================================
export const verifyAdmin = (req, res, next) => {
    try {
        // 1. Obtener la cabecera 'Authorization' de la petición
        const authHeader = req.headers.authorization;

        // 2. Comprobar que la cabecera exista y empiece con el prefijo estándar 'Bearer '
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Acceso denegado. Token no provisto o formato inválido (se requiere Bearer).' 
            });
        }

        // 3. Extraer el token (eliminando la palabra 'Bearer ' de la cadena)
        const token = authHeader.split(' ')[1];

        // 4. Verificar la autenticidad del token usando la clave secreta
        // exclusiva de admin (distinta a la de jugador: ver config/jwt.js)
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

        // 5. VALIDACIÓN CRÍTICA: Asegurar que el rol sea exclusivamente 'admin'
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Acceso denegado. Se requieren privilegios de administrador para esta sección.' 
            });
        }

        // 6. Inyectar la información decodificada en la solicitud
        req.user = decoded;

        // 7. Todo en orden, pasamos al controlador final
        next();

    } catch (error) {
        // Si el token expiró o fue alterado de forma maliciosa, cae aquí
        return res.status(401).json({ 
            message: 'Token de administrador inválido o expirado.' 
        });
    }
};