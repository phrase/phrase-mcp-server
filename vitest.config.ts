import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [{ find: /^#(.+)$/, replacement: fileURLToPath(new URL("./src/$1", import.meta.url)) }],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
