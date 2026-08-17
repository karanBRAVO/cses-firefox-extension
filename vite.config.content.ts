import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const DIRNAME = import.meta.dirname;

// A single-entry, single-chunk IIFE build for the content script. Content
// scripts run as classic (non-module) scripts, so the output must be fully
// self-contained with no `import`/`export` statements.
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
        content: path.resolve(DIRNAME, "src/content/content.ts"),
      },

      output: {
        entryFileNames: "[name].js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },

    outDir: "dist",
    emptyOutDir: false,
  },
});
