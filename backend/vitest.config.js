import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        reporter: 'verbose',
        // Resuelve el problema de symlinks de pnpm en monorepos:
        // los paquetes de backend (express, mongoose, etc.) son symlinks
        // que apuntan a node_modules en la raíz del workspace.
        // server.deps.external vacío + inline todo permite que Vitest
        // los encuentre correctamente sin romper el grafo de dependencias.
        server: {
            deps: {
                inline: [/.*/],
            }
        },
        // Agrega el node_modules raíz al path de resolución
        resolve: {
            conditions: ['node'],
        },
    },
    resolve: {
        // Asegura que los paquetes se busquen también en la raíz del monorepo
        preserveSymlinks: false,
        mainFields: ['main', 'module'],
    },
});