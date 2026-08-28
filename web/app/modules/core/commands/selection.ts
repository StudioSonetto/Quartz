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
  when: (ctx) => ctx.alignableNodes.length >= 1,
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
  when: (ctx) => ctx.alignableNodes.length >= 3,
  run: () => useAlignment().distribute(axis),
}));

const groupCommand: Command = {
  id: "core.selection.group",
  title: "Group Selection",
  category: "Arrange",
  icon: "i-carbon-group-objects",
  when: (ctx) => ctx.unlockedNodes.length >= 2,
  run: (ctx) => ctx.deck.groupSelection(),
};

const ungroupCommand: Command = {
  id: "core.selection.ungroup",
  title: "Ungroup",
  category: "Arrange",
  icon: "i-carbon-ungroup-objects",
  when: (ctx) =>
    ctx.unlockedNodes.some(
      (n: Tree) => n.type === "core.group" && n.path !== ROOT_PATH,
    ),
  run: (ctx) => ctx.deck.ungroupSelection(),
};

const duplicateCommand: Command = {
  id: "core.selection.duplicate",
  title: "Duplicate",
  category: "Edit",
  icon: "i-carbon-copy",
  when: (ctx) => ctx.selectedNodes.length >= 1,
  run: (ctx) => ctx.deck.duplicateSelection(),
};

const copyCommand: Command = {
  id: "core.selection.copy",
  title: "Copy",
  category: "Edit",
  icon: "i-carbon-copy-file",
  when: (ctx) => ctx.selectedNodes.length >= 1,
  run: (ctx) => ctx.deck.copySelection(),
};

const cutCommand: Command = {
  id: "core.selection.cut",
  title: "Cut",
  category: "Edit",
  icon: "i-carbon-cut",
  when: (ctx) => ctx.unlockedNodes.length >= 1,
  run: (ctx) => ctx.deck.cutSelection(),
};

const pasteCommand: Command = {
  id: "core.selection.paste",
  title: "Paste",
  category: "Edit",
  icon: "i-carbon-paste",
  when: (ctx) => !!ctx.deck.clipboard,
  run: (ctx) => ctx.deck.paste(),
};

export default [
  ...alignCommands,
  ...distributeCommands,
  groupCommand,
  ungroupCommand,
  duplicateCommand,
  copyCommand,
  cutCommand,
  pasteCommand,
];
