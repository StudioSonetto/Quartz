import { resolveComponent } from "vue";
export const camera: ComponentTypeDef = {
  type: "camera",
  icon: "i-carbon-camera",
  inspector: resolveComponent("LazyNodeComponentCamera"),
  defaultData: () => ({ x: 0, y: 0, z: 5 }),
};
