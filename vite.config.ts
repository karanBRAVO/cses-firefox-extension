import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const DIRNAME = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(DIRNAME, "./src"),
    },
  },

  build: {
    rollupOptions: {
      input: {
        background: path.resolve(DIRNAME, "src/background/background.ts"),
        content: path.resolve(DIRNAME, "src/content/content.ts"),
      },

      output: {
        entryFileNames: "[name].js",
      },
    },

    outDir: "dist",
    emptyOutDir: true,
  },
});
