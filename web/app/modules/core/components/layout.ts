import { resolveComponent } from "vue";
export const layout: ComponentTypeDef = {
  type: "layout",
  icon: "i-carbon-template",
  inspector: resolveComponent("LazyNodeComponentLayout"),
  defaultData: () => ({}),
};
