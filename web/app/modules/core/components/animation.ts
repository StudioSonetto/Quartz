import { resolveComponent } from "vue";
export const animation: ComponentTypeDef = {
  type: "animation",
  icon: "i-carbon-motion",
  inspector: resolveComponent("LazyNodeComponentAnimation"),
  defaultData: () => ({}),
};
