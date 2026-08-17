import { defineConfig } from "vite";
import path from "path";

const DIRNAME = import.meta.dirname;

// Same rationale as vite.config.content.ts — a self-contained IIFE bundle
// with no shared chunks.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: path.resolve(DIRNAME, "src/background/background.ts"),
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
