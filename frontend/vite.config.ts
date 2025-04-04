import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ignore-typescript-errors',
      apply: 'build',
      // @ts-ignore
      transform(code, id) {
        if (/\.tsx?$/.test(id)) {
          return {
            code,
            map: null
          };
        }
      }
    }
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
