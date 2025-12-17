import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // For GitHub Pages project sites, assets are served from "/<repo-name>/".
  // In CI we set BASE_PATH="/<repo-name>/".
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
