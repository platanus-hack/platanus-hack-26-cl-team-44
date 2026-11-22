import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// base './': los recursos usan rutas relativas. Así la misma build sirve en /v2/ y en /equipo/v2/.
export default defineConfig({
  base: './',
  plugins: [react()],
  // El motor de mirada se importa de software/eye-tracking/web/js (una sola fuente de verdad).
  server: { fs: { allow: ['.', '../../software/eye-tracking/web/js'] } },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
});
