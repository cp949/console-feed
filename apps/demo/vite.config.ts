import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cp949/console-feed': fileURLToPath(
        new URL('../../packages/console-feed/src', import.meta.url),
      ),
    },
  },
})
