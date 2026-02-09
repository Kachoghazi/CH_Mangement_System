import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Open browser on server start
    open: true,
    // Use port 3000 like CRA
    port: 3000,
  },
  // Handle global variable (needed for some libraries like Buffer)
  define: {
    global: 'globalThis',
  },
  // Build configuration
  build: {
    outDir: 'build', // Match CRA's output directory
    sourcemap: true,
  },
  // Resolve extensions
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json'],
  },
  // Configure esbuild to handle .js files as JSX (like CRA does)
  esbuild: {
    jsx: 'automatic',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
});
