// ==========================================================
// tests/setup.js
// Se ejecuta ANTES de que cualquier módulo del backend se importe.
// Es crítico para este proyecto porque config/jwt.js lanza un error
// al cargarse si faltan las variables — sin este archivo, todos los
// tests fallarían antes de siquiera empezar.
// ==========================================================

process.env.JWT_SECRET = 'test_jwt_secret_jugador';
process.env.ADMIN_JWT_SECRET = 'test_jwt_secret_admin';
process.env.COOKIE_SECRET = 'test_cookie_secret';
process.env.NODE_ENV = 'test';