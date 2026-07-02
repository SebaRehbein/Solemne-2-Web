import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        reporter: 'verbose',
        server: {
            deps: {
                inline: [/.*/],
            }
        },
        resolve: {
            conditions: ['node'],
        },
        // El test de integración corre en un pool aislado para que los
        // vi.mock() de los tests unitarios (User, bcrypt) no contaminen
        // los módulos reales que necesita el test de integración.
        // Sin esto, Mongoose podría recibir el User mockeado en vez del
        // real, y el registro devolvería 409 porque el mock no conecta
        // a ninguna base de datos real.
        poolMatchGlobs: [
            ['tests/integration.test.js', 'forks'],
        ],
    },
    resolve: {
        preserveSymlinks: false,
        mainFields: ['main', 'module'],
    },
});