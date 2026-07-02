import js from '@eslint/js';

export default [
    // Excluye explícitamente los archivos de test y config de Vitest
    // en el nivel raíz del array (así aplica globalmente en flat config)
    {
        ignores: [
            'node_modules/**',
            'tests/**',
            'vitest.config.js'
        ]
    },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        rules: {
            // 'error' en catch es válido capturarlo aunque no se use,
            // lo ignoramos con el patrón estándar de prefijo _
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_|^error$'
            }],
            'no-undef': 'error',
            'no-console': 'off',
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Node.js globals que el backend usa
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                // Web globals disponibles en Node 18+ (fetch, URLSearchParams)
                fetch: 'readonly',
                URLSearchParams: 'readonly',
            }
        }
    }
];