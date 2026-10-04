import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Any fetch request starting with '/api' will be proxied to your backend
        '/api': {
          target: 'http://127.0.0.1:18080',
          changeOrigin: true
        },
      },
    },
  };
});