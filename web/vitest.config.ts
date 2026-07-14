import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: [
      "app/modules/**/*.test.ts",
      "app/utils/**/*.test.ts",
      "app/**/__tests__/**/*.test.ts",
    ],
    environment: "node",
    environmentMatchGlobs: [["**/*.nuxt.test.ts", "nuxt"]],
  },
});
