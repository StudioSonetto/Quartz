import { resolveComponent } from "vue";

export default {
  type: "mesh",
  icon: "i-carbon-model-alt",
  inspector: resolveComponent("LazyNodeComponentMesh"),
  defaultData: () => ({
    type: "box",
    fallback: "none",
    colour: "#FAFAFA",
    texture: "default",
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
  }),
} satisfies ComponentTypeDef;
