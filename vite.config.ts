import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mkcert from 'vite-plugin-mkcert';

const DEFAULT_API_PROXY_TARGET = 'https://oz-pgti.duckdns.org';

const normalizeProxyTarget = (value: string | undefined) =>
  value?.trim().replace(/\/$/, '') || DEFAULT_API_PROXY_TARGET;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLocalHttpsEnabled = true; // Always enable HTTPS for local development to support Secure cookies
  const apiProxyTarget = normalizeProxyTarget(
    env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL,
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isLocalHttpsEnabled ? [mkcert()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      ...(isLocalHttpsEnabled ? { https: {} } : {}),
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          // Rewrite backend cookie domain to localhost so the browser accepts
          // rotated refresh cookies during local development.
          cookieDomainRewrite: {
            'oz-pgti.duckdns.org': 'localhost',
            '*': '',
          },
        },
      },
    },
  };
});
