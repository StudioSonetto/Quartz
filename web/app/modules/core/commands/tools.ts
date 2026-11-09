const tools = [
  { id: "select", title: "Select", icon: "i-carbon-cursor-1" },
  { id: "text", title: "Text", icon: "i-carbon-text-font", keys: ["t"] },
  { id: "pen", title: "Pen", icon: "i-carbon-pen", keys: ["p"] },
  { id: "point", title: "Point", icon: "i-carbon-checkbox", keys: ["a"] },
] as const;

export default tools.map(({ id, ...tool }) => ({
  ...tool,
  id: `core.tool.${id}`,
  category: "Tools",
  run: (ctx) => ctx.atelier.setActiveTool(id),
})) satisfies Command[];
