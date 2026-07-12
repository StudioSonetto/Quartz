import { resolveComponent } from "vue";
export const base: ComponentTypeDef = {
  type: "base",
  icon: "i-carbon-term",
  inspector: resolveComponent("LazyNodeComponentBase"),
  defaultData: () => ({}),
};
