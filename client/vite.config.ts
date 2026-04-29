import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite plugin that adds nonce="__CSP_NONCE__" to all <script> and
 * <link rel="modulepreload"> tags in the built index.html.
 * Nginx sub_filter replaces __CSP_NONCE__ with $request_id per-request,
 * enabling strict nonce-based CSP without 'unsafe-inline'.
 */
function cspNoncePlugin(): Plugin {
  return {
    name: 'csp-nonce',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script /g, '<script nonce="__CSP_NONCE__" ')
        .replace(/<link rel="modulepreload"/g, '<link rel="modulepreload" nonce="__CSP_NONCE__"');
    },
  };
}

export default defineConfig({
  plugins: [react(), cspNoncePlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/blog': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: 'hidden',
    cssMinify: 'lightningcss',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          markdown: ['react-markdown', 'rehype-highlight', 'rehype-sanitize', 'remark-gfm'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
