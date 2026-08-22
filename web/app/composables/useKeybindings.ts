import { onKeyStroke } from "@vueuse/core";

const ALWAYS_ALLOWED = new Set(["mod+k", "escape"]);

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

    const ctx = buildCommandContext();
    if (command.when && !command.when(ctx)) return;

    e.preventDefault();
    run(id);
  });
}
