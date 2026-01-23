import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Quan trọng cho Electron - dùng relative paths
  server: {
    port: 5173,
    strictPort: false, // Tự động tìm port khác nếu 5173 bị chiếm (sẽ được kill bởi kill-port script)
    open: false, // Không tự động mở browser
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
