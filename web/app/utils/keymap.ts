export const defaultKeymap: Record<string, string> = {
  "mod+k": "core.view.palette",
  "mod+z": "core.edit.undo",
  "mod+shift+z": "core.edit.redo",
  "mod+y": "core.edit.redo",
  "mod+a": "core.selection.selectAll",
  "mod+g": "core.selection.group",
  "mod+shift+g": "core.selection.ungroup",
  "mod+shift+l": "core.node.lock",
  "mod+d": "core.selection.duplicate",
  "mod+c": "core.selection.copy",
  "mod+x": "core.selection.cut",
  "mod+v": "core.selection.paste",
  escape: "core.selection.clear",
  p: "core.tool.pen",
  a: "core.tool.point",
  backspace: "core.node.delete",
  delete: "core.node.delete",
  arrowright: "core.slide.next",
  arrowleft: "core.slide.prev",
};

export const resolveCombo = (combo: string): string | undefined =>
  defaultKeymap[combo];

export const comboForCommand = (id: string): string | undefined =>
  Object.keys(defaultKeymap).find((combo) => defaultKeymap[combo] === id);
