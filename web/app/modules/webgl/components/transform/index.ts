import Panel from "./Panel.vue";

export default {
  type: "webgl.transform",
  icon: "i-carbon-shapes",
  inspector: Panel,
  defaultData: () => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  }),
};
