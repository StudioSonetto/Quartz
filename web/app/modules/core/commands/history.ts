import type { Command } from "#shared/types";

const undoCommand: Command = {
  id: "core.edit.undo",
  keys: ["mod+z"],
  title: "Undo",
  category: "Edit",
  menu: { canvas: 40 },
  icon: "i-carbon-undo",
  undoable: false,
  when: (ctx) => ctx.history.canUndo,
  run: (ctx) => ctx.history.undo(),
};

const redoCommand: Command = {
  id: "core.edit.redo",
  keys: ["mod+shift+z", "mod+y"],
  title: "Redo",
  category: "Edit",
  menu: { canvas: 50 },
  icon: "i-carbon-redo",
  undoable: false,
  when: (ctx) => ctx.history.canRedo,
  run: (ctx) => ctx.history.redo(),
};

export default [undoCommand, redoCommand];
