import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // In production/capacitor builds, prefix axios calls with the real backend URL.
    // In development, the dev-server proxy handles /api → localhost:5000.
    define: {
      __API_BASE__: JSON.stringify(
        mode === 'production'
          ? (env.VITE_API_BASE_URL || 'https://femfit-backend-33md.onrender.com')
          : ''
      ),
    },
    server: {
      allowedHosts: 'all',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})
