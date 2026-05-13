import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const oauthPopupHeaders = {
  // Google sign-in uses a cross-origin popup that communicates back via postMessage.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    headers: oauthPopupHeaders,
  },
  preview: {
    headers: oauthPopupHeaders,
  },
})

