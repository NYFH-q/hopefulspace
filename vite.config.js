import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件：告诉 Vite 要用 React 插件。
export default defineConfig({
  plugins: [react()],
})
