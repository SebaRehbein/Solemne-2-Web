// Hook de acceso al contexto de sesión admin: atajo para no escribir useContext(AdminAuthContext) en cada componente.
import { useContext } from 'react';
import { AdminAuthContext } from './adminAuthContextDef';

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) {
        throw new Error('useAdminAuth debe usarse dentro de <AdminAuthProvider>');
    }
    return ctx;
}