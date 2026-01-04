import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: process.env.PORT || 8000,
    strictPort: false,
    hmr: {
      clientPort: process.env.PORT || 8000,
    },
  },
  preview: {
    host: true,
    port: process.env.PORT || 8000,
    strictPort: false,
    allowedHosts: [
      'querulous-ashien-khrien-29067abe.koyeb.app',
      '.koyeb.app',
      'localhost',
      'chamberdesk.kunleisholaco.com',
    ],
  },
})
