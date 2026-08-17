import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const DIRNAME = import.meta.dirname;

// Builds the editor extension page (a real moz-extension:// page, so it can
// freely use ES modules, code-splitting, and web workers for Monaco).
// The content script and background script are built separately, as plain
// non-module IIFE bundles — see vite.config.content.ts and
// vite.config.background.ts. Keeping them apart stops the bundler from
// hoisting shared chunks (e.g. React's jsx-runtime) into an `import`
// statement, which content scripts can't execute unless declared as ES
// modules, and Firefox's content_scripts "type": "module" support is not
// reliable across versions.
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
        editor: path.resolve(DIRNAME, "editor.html"),
      },
      output: {
        // Inline Monaco's lazily-loaded language chunks (cpp.js, python.js,
        // java.js) into the main bundle instead of runtime `import()`
        // calls. AMO's validator flags dynamic `import()` with a
        // non-literal argument as "unsafe" (it can't statically verify the
        // path), which code-splitting otherwise triggers here.
        codeSplitting: false,
      },
    },

    outDir: "dist",
    emptyOutDir: true,
  },
});
