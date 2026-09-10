import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // Back-end Spring Boot em desenvolvimento: /api/* vai para localhost:8080 sem CORS.
    proxy: {
      "/api": { target: process.env.VITE_API_URL ?? "http://localhost:8080", changeOrigin: true },
    },
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
})
