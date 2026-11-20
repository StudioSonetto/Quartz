export default {
  type: "core.shape",
  label: "Shape",
  accepts: [],
  parents: ["core.group"],
  sizing: "free",
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 240, height: 240 } } },
    "core.shape",
  ],
  ai: true,
} satisfies NodeTypeData;
