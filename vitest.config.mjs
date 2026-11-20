import { defineConfig } from "vitest/config";
import TestDriver from "testdriverai/vitest";

export default defineConfig({
  test: {
    testTimeout: 900000,
    hookTimeout: 900000,
    include: ["tests/**/*.test.{js,ts,mjs}"],
    reporters: ["default", TestDriver()],
    setupFiles: ["testdriverai/vitest/setup"],
  },
});
