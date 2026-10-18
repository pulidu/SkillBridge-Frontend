import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Dev server port and API proxy target are read from `.env` so the frontend and
 * backend can be re-pointed without touching this file.
 *
 * The proxy keeps the browser on a single origin during development, which
 * means the httpOnly refresh cookie works without relaxing CORS. CORS is still
 * active on the backend for the production deployment and direct API clients.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_DEV_PORT ?? 5173);
  const previewPort = Number(env.VITE_PREVIEW_PORT ?? 4173);
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: env.VITE_DEV_HOST || 'localhost',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: env.VITE_DEV_HOST || 'localhost',
      port: previewPort,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
    },
  };
});
