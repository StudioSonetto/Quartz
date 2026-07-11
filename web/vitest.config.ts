import { defineConfig } from "vitest/config";

// The module registry is pure logic (no Vue/Nuxt runtime), so it runs in a
// plain Node environment — fast and pristine. When a future test needs the
// Nuxt runtime (auto-imports, component mounting), adopt @nuxt/test-utils's
// defineVitestConfig with a nuxt environment for that test then.
export default defineConfig({
  test: {
    include: ["app/modules/**/*.test.ts"],
    environment: "node",
  },
});
