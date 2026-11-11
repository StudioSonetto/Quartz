export function openCommandMenu(event: MouseEvent, menu: CommandMenu) {
  if (useAtelierStore().activeTool !== "select") return;

  const ctx = buildCommandContext();
  const { run } = useCommands();
  const items: ContextMenuItem[] = [];

  const commands = allCommands()
    .filter(
      (c) =>
        c.menu?.[menu] !== undefined &&
        isModuleUnlocked(c.id) &&
        (!c.when || c.when(ctx)),
    )
    .sort((a, b) => a.menu![menu]! - b.menu![menu]!);

  for (const command of commands) {
    const item: ContextMenuItem = {
      id: command.id,
      label: command.title,
      icon: command.icon,
      shortcut: formatShortcut(command.keys?.[0]),
      danger: command.danger,
      action: () => run(command.id),
    };

    if (!command.submenu) {
      items.push(item);
      continue;
    }

    const id = `submenu:${command.submenu}`;
    let group = items.find((i) => i.id === id);

    if (!group) {
      group = { id, label: command.submenu, icon: command.icon, children: [] };
      items.push(group);
    }

    group.children!.push(item);
  }

  // Empty: let the event fall through to the canvas menu.
  if (!items.length) return;

  event.preventDefault();
  event.stopPropagation();
  useContextMenu().open(event, items);
}
