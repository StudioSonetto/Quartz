export default {
  type: "core.group",
  label: "Group",
  accepts: ["core.group", "core.text"],
  defaultComponents: ["core.base", "core.transform", "core.layout"],
  creatable: false,
  sizing: "derived",
  ai: true,
} satisfies NodeTypeData;
