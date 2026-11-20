export default {
  type: "core.media",
  label: "Media",
  accepts: [],
  parents: ["core.group"],
  sizing: "fixed",
  defaultComponents: [
    "core.base",
    { type: "core.transform", data: { size: { width: 480, height: 270 } } },
    "core.media",
  ],
  ai: true,
} satisfies NodeTypeData;
