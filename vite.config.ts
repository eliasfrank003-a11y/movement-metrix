import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from https://<user>.github.io/movement-metrix/, so assets need the
  // repo name as a prefix. Note the repo is "metrix", not "metrics".
  base: '/movement-metrix/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Reachable from your phone on the same network during development.
    host: true,
  },
});
