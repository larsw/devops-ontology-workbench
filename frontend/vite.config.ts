import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
    // Increase chunk size warning limit to avoid warnings for large libraries
    chunkSizeWarningLimit: 2000,
    // Additional build optimizations
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      // Multi-page app setup
      input: {
        main: resolve(__dirname, 'index.html'),
        test: resolve(__dirname, 'test.html')
      },
      // Configure manual chunks for better code splitting
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          'vendor-yasgui': ['@zazuko/yasgui', '@zazuko/yasqe', '@zazuko/yasr'],
          'vendor-d3': ['d3'],
          'vendor-other': ['n3'],
          // App chunks
          'app-core': ['./src/data-loader.ts', './src/graph-visualization.ts', './src/ui-components.ts'],
          'app-features': ['./src/sparql-interface.ts', './src/graph-layouts.ts']
        }
      },
      // Suppress eval warnings from external dependencies
      onwarn(warning, warn) {
        // Suppress eval warnings from Yasgui dependencies
        if (warning.code === 'EVAL' && 
            (warning.loc?.file?.includes('yasgui') || 
             warning.loc?.file?.includes('yasr') ||
             warning.loc?.file?.includes('yasqe'))) {
          return;
        }
        
        // Suppress circular dependency warnings from external dependencies
        if (warning.code === 'CIRCULAR_DEPENDENCY' && 
            warning.message.includes('node_modules')) {
          return;
        }
        
        // Suppress use of eval warnings from external deps
        if (warning.message?.includes('Use of eval') && 
            (warning.message.includes('yasgui') || 
             warning.message.includes('yasr') ||
             warning.message.includes('yasqe'))) {
          return;
        }
        
        // Let other warnings through
        warn(warning);
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy SPARQL API calls to backend
      '/sparql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('SPARQL proxy error:', err.message);
          });
        }
      },
      // Proxy API calls to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error:', err.message);
          });
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})
