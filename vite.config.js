import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for React development
// This sets up the build tool with React plugin support
export default defineConfig({
  plugins: [react()],
})
