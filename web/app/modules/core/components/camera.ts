import { resolveComponent } from "vue";

export default {
  type: "camera",
  icon: "i-carbon-camera",
  inspector: resolveComponent("LazyNodeComponentCamera"),
  defaultData: () => ({ x: 0, y: 0, z: 5 }),
} satisfies ComponentTypeDef;
