import { resolveComponent } from "vue";
export const transform: ComponentTypeDef = {
  type: "transform",
  icon: "i-carbon-shapes",
  inspector: resolveComponent("LazyNodeComponentTransform"),
  defaultData: () => ({ position: { x: 0, y: 0, z: 0 }, scale: 1 }),
};
