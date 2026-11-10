export const NODE_MENU = [
  "core.selection.copy",
  "core.selection.cut",
  "core.selection.paste",
  "core.selection.duplicate",
  "core.selection.group",
  "core.selection.ungroup",
  "core.node.lock",
  "core.node.delete",
];

export const CANVAS_MENU = [
  "core.selection.paste",
  "core.selection.selectAll",
  "core.view.addNode",
  "core.edit.undo",
  "core.edit.redo",
  "core.view.palette",
];

export function openCommandMenu(event: MouseEvent, ids: string[]) {
  if (useAtelierStore().activeTool !== "select") return;

  event.preventDefault();
  event.stopPropagation();

  const { enabledCommands, run } = useCommands();
  const byId = new Map(enabledCommands.value.map((c) => [c.command.id, c]));

  useContextMenu().open(
    event,
    ids.flatMap((id) => {
      const entry = byId.get(id);

      if (!entry?.enabled) return [];

      const { command } = entry;

      return {
        label: command.title,
        icon: command.icon,
        shortcut: command.keys?.[0],
        danger: command.danger,
        action: () => run(id),
      };
    }),
  );
}
