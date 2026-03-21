import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/box-ai/',
  server: { 
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['@mediapipe/pose', '@tensorflow-models/pose-detection']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
