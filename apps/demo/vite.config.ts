import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cp949/console-feed': path.resolve(
        __dirname,
        '../../packages/console-feed/src',
      ),
    },
  },
})
