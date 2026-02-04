import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/devsecops-pipe/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playbooks: resolve(__dirname, 'playbooks.html'),
      },
    },
  },
})
