export default {
  type: "core.path",
  optional: true,
  only: ["core.shape"],
  defaultData: () => ({
    points: [],
    closed: false,
  }),
} satisfies ComponentTypeData;
