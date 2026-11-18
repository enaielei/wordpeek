import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'wordpeek-development-csp',
      apply: 'serve',
      transformIndexHtml: {
        order: 'post',
        handler: (html) =>
          html.replace(
            "script-src 'self'",
            "script-src 'self' 'unsafe-inline'",
          ),
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.mjs'],
    restoreMocks: true,
  },
});
