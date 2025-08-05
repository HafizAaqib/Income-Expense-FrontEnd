import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://income-expense-backend.on.shiper.app',
        changeOrigin: true,
      },
    },
  },
})
