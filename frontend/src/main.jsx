import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        {/* Define las rutas de la app: "/" es el juego de siempre (App.jsx intacto), "/admin/*" es el panel separado con su propio login y sesión JWT en localStorage. */}
        <Routes>
          {/* El juego (con login/registro de jugador) sigue viviendo en App.jsx, sin cambios */}
          <Route path="/" element={<App />} />

          {/* Panel de administración: completamente separado del juego */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)