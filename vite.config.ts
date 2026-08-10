import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/background.ts"),
        content: resolve(__dirname, "src/content/content.ts"),
      },

      output: {
        entryFileNames: "[name].js",
      },
    },

    outDir: "dist",
    emptyOutDir: true,
  },
});
