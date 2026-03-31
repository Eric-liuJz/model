import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true // 自动打包合并类型文件
    })
  ],
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
