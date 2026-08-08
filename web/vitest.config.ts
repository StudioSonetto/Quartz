import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    hookTimeout: 60000,
  },
});
