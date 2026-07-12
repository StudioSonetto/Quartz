import Transform from "~/components/node/component/Transform.vue";

export default {
  type: "transform",
  icon: "i-carbon-shapes",
  inspector: Transform,
  defaultData: () => ({ position: { x: 0, y: 0, z: 0 }, scale: 1 }),
} satisfies ComponentTypeDef;