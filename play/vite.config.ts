import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@star-table\/core$/,
        replacement: fileURLToPath(new URL('../packages/table/src/index.ts', import.meta.url))
      }
    ]
  }
})
