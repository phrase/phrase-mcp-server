import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      { find: "#package.json", replacement: fileURLToPath(new URL("./package.json", import.meta.url)) },
      { find: /^#(.+)$/, replacement: fileURLToPath(new URL("./src/$1", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        lines: 80
      },
    },
  },
});
