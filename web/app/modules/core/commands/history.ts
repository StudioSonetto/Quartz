import type { Command } from "#shared/types";

const undoCommand: Command = {
  id: "core.edit.undo",
  title: "Undo",
  category: "Edit",
  icon: "i-carbon-undo",
  undoable: false,
  when: () => useHistoryStore().canUndo,
  run: () => useHistoryStore().undo(),
};

const redoCommand: Command = {
  id: "core.edit.redo",
  title: "Redo",
  category: "Edit",
  icon: "i-carbon-redo",
  undoable: false,
  when: () => useHistoryStore().canRedo,
  run: () => useHistoryStore().redo(),
};

export default [undoCommand, redoCommand];
