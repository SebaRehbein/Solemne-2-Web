import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // URL de tu backend de Express
    withCredentials: true // <-- CRUCIAL: Permite el envío automático de cookies
});

export default api;