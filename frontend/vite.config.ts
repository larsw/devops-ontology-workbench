import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true
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
