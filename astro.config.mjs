import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    checkOrigin: false,
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: "_astro/[name].[hash].[ext]",
        },
      },
    },
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
    port: 4321,
  },
});
