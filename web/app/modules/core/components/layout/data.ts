export default {
  type: "core.layout",
  defaultData: () => ({
    mode: "free",
    direction: "vertical",
    background: { type: "none" },
    padding: 0,
    columns: 1,
    gap: 0,
    align: "start",
    justify: "start",
    fill: false,
  }),
  ai: {
    fields: [
      "mode",
      "direction",
      "columns",
      "gap",
      "padding",
      "align",
      "justify",
      "fill",
      "background",
    ],
  },
} satisfies ComponentTypeData;
