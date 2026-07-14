import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h, ref } from "vue";

// Minimal smoke test proving the Nuxt test environment actually boots:
// mounts a tiny component inside a real Nuxt app context via mountSuspended.
describe("nuxt test environment", () => {
  it("boots a Nuxt app context and mounts a component", async () => {
    const TestComponent = defineComponent({
      setup() {
        const count = ref(1);
        return () => h("div", `count: ${count.value}`);
      },
    });

    const wrapper = await mountSuspended(TestComponent);
    expect(wrapper.text()).toBe("count: 1");
  });
});
