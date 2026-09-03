const tools = [
  { id: "select", title: "Select Tool", icon: "i-carbon-cursor-1" },
  { id: "pen", title: "Pen Tool", icon: "i-carbon-pen" },
  { id: "point", title: "Point Tool", icon: "i-carbon-checkbox" },
] as const;

export default tools.map(({ id, title, icon }) => ({
  id: `core.tool.${id}`,
  title,
  category: "Tools",
  icon,
  run: (ctx) => ctx.atelier.setActiveTool(id),
})) satisfies Command[];
