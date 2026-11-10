const deleteCommand: Command = {
  id: "core.node.delete",
  keys: ["backspace", "delete"],
  title: "Delete",
  category: "Node",
  menu: { node: 80 },
  icon: "i-carbon-trash-can",
  danger: true,
  when: (ctx) => ctx.unlockedNodes.some((n) => n.path !== ROOT_PATH),
  run: (ctx) => ctx.deck.deleteSelectedNodes(),
};

const lockCommand: Command = {
  id: "core.node.lock",
  keys: ["mod+shift+l"],
  title: "Lock / Unlock",
  category: "Node",
  menu: { node: 70 },
  icon: "i-carbon-locked",
  when: (ctx) => ctx.selectedNodes.some((n) => n.path !== ROOT_PATH),
  run: (ctx) => {
    const targets = ctx.selectedNodes.filter((n) => n.path !== ROOT_PATH);

    const locked = targets.some((n) => !isNodeLocked(n));

    for (const node of targets) ctx.deck.updateNode(node.id, { locked });
  },
};

const selectAllCommand: Command = {
  id: "core.selection.selectAll",
  keys: ["mod+a"],
  title: "Select All",
  category: "Selection",
  menu: { canvas: 20 },
  icon: "i-carbon-select-window",
  when: (ctx) => !!ctx.deckId,
  undoable: false,
  run: (ctx) => ctx.deck.selectAll(),
};

const clearSelectionCommand: Command = {
  id: "core.selection.clear",
  keys: ["escape"],
  title: "Clear Selection",
  category: "Selection",
  icon: "i-carbon-close",
  when: (ctx) =>
    ctx.selectedNodeIds.length > 0 || ctx.atelier.activeTool !== "select",
  undoable: false,
  run: (ctx) =>
    ctx.atelier.activeTool !== "select"
      ? ctx.atelier.setActiveTool("select")
      : useNodeSelection().clear(),
};

export default [
  deleteCommand,
  lockCommand,
  selectAllCommand,
  clearSelectionCommand,
];
