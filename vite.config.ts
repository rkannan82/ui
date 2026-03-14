import path from 'path';

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { oidcServerPlugin } from './plugins/vite-plugin-oidc-server';
import { temporalServer } from './plugins/vite-plugin-temporal-server';
import { uiServerPlugin } from './plugins/vite-plugin-ui-server';

export default defineConfig({
  plugins: [
    sveltekit(),
    oidcServerPlugin(),
    temporalServer(),
    uiServerPlugin(),
  ],
  optimizeDeps: {
    include: ['date-fns', 'date-fns-tz'],
  },
  resolve: {
    alias: {
      $types: path.resolve('./src/types'),
      $fixtures: path.resolve('./src/fixtures'),
      $components: path.resolve('./src/lib/components/'),
      $holocene: path.resolve('./src/lib/holocene'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '^/api/v1/namespaces/.+/insights': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/v1': {
        target: 'http://localhost:8233',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
});
