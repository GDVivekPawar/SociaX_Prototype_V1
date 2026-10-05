import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/SociaX_Prototype_V1/' : '/',
  plugins: [react()],
  server: {
    port: 4000,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
