// Note 1: Vitest does not automatically inherit the `@/*` path alias from
// Next.js, so route tests that import App Router modules need the alias defined
// here to resolve the same files as the application build.
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
