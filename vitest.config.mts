import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Several test files share the same seeded Café A establishment as a
    // fixture; running files in parallel would let them race on shared
    // counts (e.g. dashboard stats). Sequential keeps it deterministic.
    fileParallelism: false,
  },
});
