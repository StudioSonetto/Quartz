export function openCommandMenu(event: MouseEvent, menu: CommandMenu) {
  if (useAtelierStore().activeTool !== "select") return;

  const ctx = buildCommandContext();
  const { run } = useCommands();
  const items = allCommands()
    .filter(
      (c) =>
        c.menu?.[menu] !== undefined &&
        isModuleUnlocked(c.id) &&
        (!c.when || c.when(ctx)),
    )
    .sort((a, b) => a.menu![menu]! - b.menu![menu]!)
    .map((command) => ({
      id: command.id,
      label: command.title,
      icon: command.icon,
      shortcut: formatShortcut(command.keys?.[0]),
      danger: command.danger,
      action: () => run(command.id),
    }));

  // Empty: let the event fall through to the canvas menu.
  if (!items.length) return;

  event.preventDefault();
  event.stopPropagation();
  useContextMenu().open(event, items);
}
