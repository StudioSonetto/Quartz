import { resolveComponent } from "vue";

export default {
  type: "base",
  icon: "i-carbon-term",
  inspector: resolveComponent("LazyNodeComponentBase"),
  defaultData: () => ({}),
} satisfies ComponentTypeDef;
