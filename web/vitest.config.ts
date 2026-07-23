import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Runtime-environment tests live in test/nuxt/; unit + e2e stay on node.
    environmentMatchGlobs: [["test/nuxt/**", "nuxt"]],
  },
});
