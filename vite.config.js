import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [  
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('sl-')
        }
      }
    })
  ],
  base: '/parcel-scoring-app/',
  css: {
    preprocessorOptions: {
      less: {
        // Add any Less-specific configuration here
      }
    }
  }
});

