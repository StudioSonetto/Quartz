import { resolveComponent } from "vue";

export default {
  type: "animation",
  icon: "i-carbon-motion",
  inspector: resolveComponent("LazyNodeComponentAnimation"),
  defaultData: () => ({}),
} satisfies ComponentTypeDef;
