export default {
  type: "core.transform",
  units: { rotation: "°" },
  defaultData: () => ({
    position: { x: 0, y: 0, z: 0 },
    size: { width: "auto", height: "auto" },
    rotation: 0,
    scale: 1,
  }),
} satisfies ComponentTypeData;
