/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom'
  },
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StarTableV2',
      fileName: (format) => `star-table-v2.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@element-plus/icons-vue', 'dayjs', '@vueuse/core', 'xlsx'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus'
        }
      }
    }
  }
})
