// Solo define el "buzón" de contexto de sesión admin (sin lógica). Separado de AdminAuthContext.jsx porque Fast Refresh exige que un .jsx solo exporte componentes.
import { createContext } from 'react';

export const AdminAuthContext = createContext(null);