import { resolveComponent } from "vue";

export default {
  type: "scene",
  icon: "i-carbon-web-services-container",
  inspector: resolveComponent("LazyNodeComponentScene"),
  defaultData: () => ({ background: "#151515" }),
} satisfies ComponentTypeDef;
