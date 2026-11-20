export default {
  type: "core.typography",
  defaultData: () => ({
    alignment: "left",
    colour: "#151515",
    content: "New Text",
    font: "Azeret Mono",
    size: 30,
    style: [],
    weight: 300,
    lineHeight: 1.2,
    letterSpacing: 0,
    textTransform: "none",
    opacity: 1,
  }),
  ai: { fields: ["content", "size", "colour", "alignment"] },
} satisfies ComponentTypeData;
