import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const LOCAL_HTTPS_KEY_PATH = path.resolve('certs/localhost-key.pem');
const LOCAL_HTTPS_CERT_PATH = path.resolve('certs/localhost.pem');
const DEFAULT_API_PROXY_TARGET = 'https://oz-pgti.duckdns.org';

const readLocalHttpsConfig = () => {
  if (
    !fs.existsSync(LOCAL_HTTPS_KEY_PATH) ||
    !fs.existsSync(LOCAL_HTTPS_CERT_PATH)
  ) {
    throw new Error(
      [
        '로컬 HTTPS 인증서를 찾을 수 없습니다.',
        '`npm run dev` 전에 아래 명령을 먼저 실행해주세요.',
        'mkcert -install',
        'mkdir -p certs',
        'mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1',
      ].join('\n'),
    );
  }

  return {
    key: fs.readFileSync(LOCAL_HTTPS_KEY_PATH),
    cert: fs.readFileSync(LOCAL_HTTPS_CERT_PATH),
  };
};

const normalizeProxyTarget = (value: string | undefined) =>
  value?.trim().replace(/\/$/, '') || DEFAULT_API_PROXY_TARGET;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLocalHttpsEnabled = env.VITE_DEV_HTTPS === 'true';
  const apiProxyTarget = normalizeProxyTarget(
    env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL,
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          // Strip the backend cookie domain in dev so refresh cookies bind to
          // localhost and survive same-origin reloads through the Vite proxy.
          cookieDomainRewrite: '',
        },
      },
      ...(isLocalHttpsEnabled ? { https: readLocalHttpsConfig() } : {}),
    },
  };
});
