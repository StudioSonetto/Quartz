const ALWAYS_ALLOWED = new Set(["mod+k", "escape"]);

const ALWAYS_CLAIMED = new Set(["core.edit.undo", "core.edit.redo"]);

export function useKeybindings() {
  const { run } = useCommands();

  onKeyStroke((e: KeyboardEvent) => {
    if (e.defaultPrevented) return;

    if (isInsideOpenDialog(e.target)) return;

    const combo = eventToCombo(e);

    if (isEditableTarget(e.target) && !ALWAYS_ALLOWED.has(combo)) return;

    const id = resolveCombo(combo);
    if (!id) return;

    const command = getCommand(id);
    if (!command) return;

    if (ALWAYS_CLAIMED.has(id)) e.preventDefault();

    const ctx = buildCommandContext();
    if (command.when && !command.when(ctx)) return;

    e.preventDefault();
    run(id);
  });
}
