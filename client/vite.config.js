import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Keep the heavy 3D stack in its own chunk so the landing/auth pages stay small.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
