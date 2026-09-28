const ALWAYS_ALLOWED = new Set(["mod+k", "escape"]);

const ALWAYS_CLAIMED = new Set(["core.edit.undo", "core.edit.redo"]);

export function useKeybindings() {
  const { run } = useCommands();

  onKeyStroke((e: KeyboardEvent) => {
    if (e.defaultPrevented) return;

    if (isInsideOpenDialog(e.target)) return;

    const combo = eventToCombo(e);

    if (isEditableTarget(e.target) && !ALWAYS_ALLOWED.has(combo)) return;

    const command = commandForKey(combo);
    if (!command) return;

    if (ALWAYS_CLAIMED.has(command.id)) e.preventDefault();

    const ctx = buildCommandContext();
    if (command.when && !command.when(ctx)) return;

    e.preventDefault();
    run(command.id);
  });
}
