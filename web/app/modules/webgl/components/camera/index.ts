import Panel from "./Panel.vue";

export default {
  type: "webgl.camera",
  icon: "i-carbon-camera",
  inspector: Panel,
  defaultData: () => ({ x: 0, y: 0, z: 5 }),
};
