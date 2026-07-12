import { resolveComponent } from "vue";
export const scene: ComponentTypeDef = {
  type: "scene",
  icon: "i-carbon-web-services-container",
  inspector: resolveComponent("LazyNodeComponentScene"),
  defaultData: () => ({ background: "#151515" }),
};
