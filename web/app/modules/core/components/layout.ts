import { resolveComponent } from "vue";

export default {
  type: "layout",
  icon: "i-carbon-template",
  inspector: resolveComponent("LazyNodeComponentLayout"),
  defaultData: () => ({}),
} satisfies ComponentTypeDef;
