import type { Command } from "#shared/types";

const undoCommand: Command = {
  id: "core.edit.undo",
  title: "Undo",
  category: "Edit",
  icon: "i-carbon-undo",
  undoable: false,
  when: (ctx) => ctx.history.canUndo,
  run: (ctx) => ctx.history.undo(),
};

const redoCommand: Command = {
  id: "core.edit.redo",
  title: "Redo",
  category: "Edit",
  icon: "i-carbon-redo",
  undoable: false,
  when: (ctx) => ctx.history.canRedo,
  run: (ctx) => ctx.history.redo(),
};

export default [undoCommand, redoCommand];
