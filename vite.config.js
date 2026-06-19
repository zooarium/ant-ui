import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({ filename: 'stats.html', open: false, gzipSize: true, brotliSize: true, template: 'treemap' }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // Prevent duplicate React from symlinked @aviary-ui file: deps — hooks crash without this.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // Bind 0.0.0.0 → reachable from any host on the network and via /etc/hosts domains.
    host: true,
    // Accept any Host header (custom local domains). Tighten to a list for stricter setups.
    allowedHosts: true,
    watch: {
      // Watch @aviary-ui dist/ so HMR fires when aviary-ui packages are rebuilt.
      ignored: (path) => path.includes('node_modules') && !path.includes('@aviary-ui'),
    },
  },
  optimizeDeps: {
    // Load @aviary-ui fresh on each rebuild — skip Vite's pre-bundle cache.
    exclude: ['@aviary-ui/core', '@aviary-ui/ui'],
  },
  build: {
    rollupOptions: {
      // Two entries → two bundles: public (index.html, tenant-facing) and
      // admin (admin.html, served on its own domain). Admin code never ships
      // to tenant users.
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
}));
