import jwt from 'jsonwebtoken';

// ==========================================================
// Middleware para verificar jugadores (Cookies httpOnly)
// ==========================================================
export const verifyPlayer = (req, res, next) => {
    try {
        // 1. Extraer el token de las cookies
        const token = req.cookies.sessionToken;

        // 2. Si no hay token, rechazamos la petición
        if (!token) {
            return res.status(401).json({ 
                message: 'Acceso denegado. No se encontró un token de sesión.' 
            });
        }

        // 3. Verificar el token con nuestra clave secreta
        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
        const decoded = jwt.verify(token, jwtSecret);

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
        const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
        const decoded = jwt.verify(token, jwtSecret);

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