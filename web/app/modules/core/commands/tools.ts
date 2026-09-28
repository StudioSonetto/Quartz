const tools = [
  { id: "select", title: "Select Tool", icon: "i-carbon-cursor-1" },
  { id: "pen", title: "Pen Tool", icon: "i-carbon-pen", keys: ["p"] },
  { id: "point", title: "Point Tool", icon: "i-carbon-checkbox", keys: ["a"] },
] as const;

export default tools.map(({ id, ...tool }) => ({
  ...tool,
  id: `core.tool.${id}`,
  category: "Tools",
  run: (ctx) => ctx.atelier.setActiveTool(id),
})) satisfies Command[];
