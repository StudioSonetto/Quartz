const deleteCommand: Command = {
  id: "core.node.delete",
  title: "Delete Node",
  category: "Node",
  icon: "i-carbon-trash-can",
  when: (ctx) => ctx.unlockedNodes.some((n) => n.path !== ROOT_PATH),
  run: (ctx) => ctx.deck.deleteSelectedNodes(),
};

const lockCommand: Command = {
  id: "core.node.lock",
  title: "Lock / Unlock",
  category: "Node",
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
  title: "Select All",
  category: "Selection",
  icon: "i-carbon-select-window",
  when: (ctx) => !!ctx.deckId,
  undoable: false,
  run: (ctx) => ctx.deck.selectAll(),
};

const clearSelectionCommand: Command = {
  id: "core.selection.clear",
  title: "Clear Selection",
  category: "Selection",
  icon: "i-carbon-close",
  when: (ctx) => ctx.selectedNodeIds.length > 0,
  undoable: false,
  run: () => useNodeSelection().clear(),
};

export default [
  deleteCommand,
  lockCommand,
  selectAllCommand,
  clearSelectionCommand,
];
