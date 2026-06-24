/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Configura el entorno simulado de navegador para las pruebas
    globals: true,        // Permite usar describe, it, expect globalmente en los archivos .test.jsx
  },
})