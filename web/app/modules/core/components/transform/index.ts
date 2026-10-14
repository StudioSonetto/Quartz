import Panel from "./Panel.vue";

export default {
  type: "core.transform",
  icon: "i-carbon-shapes",
  inspector: Panel,
  ai: { fields: { size: '{ width, height }, each a number in px or "auto" to fit the content' } },
  units: { rotation: "°" },
  defaultData: () => ({
    position: { x: 0, y: 0, z: 0 },
    size: { width: "auto", height: "auto" },
    rotation: 0,
    scale: 1,
  }),
};
