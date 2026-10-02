import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: process.env["VITE_BASE"] ?? "/next/",
  build: {
    outDir: "../../next",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@taroko/core": resolve(__dirname, "../../packages/core/src/index.ts"),
      "@taroko/schema": resolve(__dirname, "../../packages/schema/src/index.ts"),
      "@taroko/artifact-runtime": resolve(__dirname, "../../packages/artifact-runtime/src/index.ts"),
      "@taroko/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@taroko/fixtures": resolve(__dirname, "../../packages/fixtures/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "../../packages/*/src/**/*.{test,spec}.ts"],
  },
});
