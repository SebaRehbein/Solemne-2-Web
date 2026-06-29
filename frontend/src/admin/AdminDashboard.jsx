// Pantalla principal del admin (ruta /admin/dashboard): lista los jugadores registrados via GET /api/admin/users.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../api/adminAxios';
import { useAdminAuth } from './useAdminAuth';
import './admin.css';

export default function AdminDashboard() {
    const { admin, logout } = useAdminAuth();
    const navigate = useNavigate();

    const [players, setPlayers] = useState([]);
    const [error, setError] = useState('');
    const [loadingPlayers, setLoadingPlayers] = useState(true);

    useEffect(() => {
        let isMounted = true;

        adminApi.get('/users')
            .then((res) => {
                if (isMounted) setPlayers(res.data.players || []);
            })
            .catch((err) => {
                if (!isMounted) return;
                // 404 lo usa el backend cuando no hay jugadores registrados,
                // no es realmente un error del panel.
                if (err.response?.status === 404) {
                    setPlayers([]);
                } else {
                    setError(err.response?.data?.message || 'No se pudo cargar la lista de jugadores.');
                }
            })
            .finally(() => {
                if (isMounted) setLoadingPlayers(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="admin-page">
            <div className="admin-dashboard">
                <header className="admin-header">
                    <div>
                        <h1>Panel de Administración</h1>
                        {admin && <p className="admin-subtitle">Conectado como {admin.username} ({admin.email})</p>}
                    </div>
                    <button className="admin-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
                </header>

                <section className="admin-players">
                    <h2>Jugadores registrados</h2>

                    {loadingPlayers && <p>Cargando jugadores...</p>}
                    {error && <p className="admin-error">{error}</p>}

                    {!loadingPlayers && !error && players.length === 0 && (
                        <p>No hay jugadores registrados todavía.</p>
                    )}

                    {!loadingPlayers && players.length > 0 && (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Nivel</th>
                                    <th>Mejor puntaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player._id}>
                                        <td>{player.username}</td>
                                        <td>{player.email}</td>
                                        <td>{player.progress?.nivel ?? '-'}</td>
                                        <td>{player.progress?.mejorPuntaje?.puntos ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}