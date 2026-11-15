import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Dev convenience: lets http://localhost:5173 reach the API without Caddy.
  // The main entry point is still https://localhost.
  server: {
    proxy: {
      "/api": "http://backend:3000",
    },
  },
});
