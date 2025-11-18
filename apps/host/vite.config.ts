import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@erp/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@erp/theme': path.resolve(__dirname, '../../packages/theme/src'),
      '@modules/default-module': path.resolve(__dirname, '../../modules/default-module/src')
    }
  }
});

