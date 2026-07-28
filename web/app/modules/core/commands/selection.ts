import type { Command } from "#shared/types";
import type { AlignOp } from "~/utils/align";

const alignOps: { op: AlignOp; title: string; icon: string }[] = [
  { op: "left", title: "Align Left", icon: "i-carbon-align-horizontal-left" },
  {
    op: "centreH",
    title: "Align Centre",
    icon: "i-carbon-align-horizontal-center",
  },
  {
    op: "right",
    title: "Align Right",
    icon: "i-carbon-align-horizontal-right",
  },
  { op: "top", title: "Align Top", icon: "i-carbon-align-vertical-top" },
  {
    op: "middleV",
    title: "Align Middle",
    icon: "i-carbon-align-vertical-center",
  },
  {
    op: "bottom",
    title: "Align Bottom",
    icon: "i-carbon-align-vertical-bottom",
  },
];

const alignCommands: Command[] = alignOps.map(({ op, title, icon }) => ({
  id: `core.selection.align.${op}`,
  title,
  category: "Arrange",
  icon,
  when: (ctx) => ctx.selectedNodes.length >= 1,
  run: () => useAlignment().align(op),
}));

const distributeCommands: Command[] = [
  {
    axis: "h" as const,
    title: "Distribute Horizontally",
    icon: "i-carbon-distribute-horizontal-center",
  },
  {
    axis: "v" as const,
    title: "Distribute Vertically",
    icon: "i-carbon-distribute-vertical-center",
  },
].map(({ axis, title, icon }) => ({
  id: `core.selection.distribute.${axis}`,
  title,
  category: "Arrange",
  icon,
  when: (ctx) => ctx.selectedNodes.length >= 3,
  run: () => useAlignment().distribute(axis),
}));

export default [...alignCommands, ...distributeCommands];
