// Guardia de rutas: bloquea el acceso al dashboard si no hay sesión admin válida, redirigiendo a /admin/login.
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';

// Envuelve cualquier ruta que requiera sesión de admin.
// Mientras se valida el token (loading), no decide nada todavía:
// evita un redirect prematuro al login si el token sí es válido.
export default function ProtectedAdminRoute({ children }) {
    const { isAuthenticated, loading } = useAdminAuth();

    if (loading) {
        return (
            <div style={{ color: '#fff', textAlign: 'center', marginTop: '40px' }}>
                Verificando sesión...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}