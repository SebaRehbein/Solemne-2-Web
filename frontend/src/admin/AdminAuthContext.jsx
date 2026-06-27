// Provider que llena el contexto de sesión admin: valida el token guardado al cargar, y expone login()/logout().
import { useEffect, useState, useCallback } from 'react';
import adminApi, { ADMIN_TOKEN_KEY } from '../api/adminAxios';
import { AdminAuthContext } from './adminAuthContextDef';

export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    // loading = true mientras verificamos si hay un token guardado válido.
    // Evita un "parpadeo" hacia el login al refrescar la página.
    // Se inicializa de forma lazy: solo es true si realmente hay un token
    // que necesite ser validado contra el backend.
    const [loading, setLoading] = useState(() => !!localStorage.getItem(ADMIN_TOKEN_KEY));

    // Al montar el provider, si hay un token en localStorage, lo validamos
    // contra GET /api/admin/me. Si el token expiró o es inválido, el
    // interceptor de adminApi ya se encarga de borrarlo.
    useEffect(() => {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) return;

        adminApi.get('/me')
            .then((res) => setAdmin(res.data.admin))
            .catch(() => setAdmin(null))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await adminApi.post('/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        setAdmin(user);
        return user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdmin(null);
    }, []);

    const value = { admin, loading, login, logout, isAuthenticated: !!admin };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
}