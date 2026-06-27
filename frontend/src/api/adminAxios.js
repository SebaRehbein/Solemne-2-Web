// Cliente HTTP del panel de admin: a diferencia del axios del jugador (cookies), este adjunta el JWT a mano via header Authorization.
import axios from 'axios';

// ==========================================================
// Instancia de axios EXCLUSIVA para el panel de administración.
//
// A diferencia de `api` (api/axios.js), que usa cookies httpOnly
// para los jugadores (withCredentials: true), el admin se autentica
// con un JWT que el propio frontend debe guardar y enviar a mano
// en el header Authorization: Bearer <token>.
//
// No usamos withCredentials aquí porque no dependemos de cookies.
// ==========================================================

export const ADMIN_TOKEN_KEY = 'admin_token';

const adminApi = axios.create({
    baseURL: 'http://localhost:3000/api/admin',
});

// --- Interceptor de REQUEST ---
// Antes de cada petición, leemos el token guardado en localStorage
// y lo adjuntamos automáticamente en el header Authorization.
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Interceptor de RESPONSE ---
// Si el backend responde 401 (token inválido/expirado) o 403
// (no es admin), limpiamos el token guardado. El componente que
// use esta instancia es responsable de redirigir al login.
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
        return Promise.reject(error);
    }
);

export default adminApi;