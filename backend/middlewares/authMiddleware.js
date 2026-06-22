import jwt from 'jsonwebtoken';

// Exportamos la función middleware verifyPlayer
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
        // Esto permite que las rutas que vengan después puedan saber quién está haciendo la petición
        req.user = decoded;

        // 5. Todo está correcto, pasamos el control a la siguiente función
        next();

    } catch (error) {
        // Si jwt.verify falla (token modificado o expirado), cae aquí
        return res.status(401).json({ 
            message: 'Token inválido o expirado. Inicia sesión nuevamente.' 
        });
    }
};