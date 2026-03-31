import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StarTableCore',
      fileName: (format) => `star-table-core.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@element-plus/icons-vue', 'dayjs', '@vueuse/core', 'sortablejs', 'lodash-es', 'xlsx'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus'
        }
      }
    }
  }
});
