import { onKeyStroke } from "@vueuse/core";
import { eventToCombo } from "~/utils/keyCombo";
import { resolveCombo } from "~/utils/keymap";
import { getCommand } from "~/modules/registry";
import { buildCommandContext } from "~/composables/commandContext";

const ALWAYS_ALLOWED = new Set(["mod+k", "escape"]);

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable === true
  );
}

export function useKeybindings() {
  const { run } = useCommands();

  onKeyStroke((e: KeyboardEvent) => {
    const combo = eventToCombo(e);

    // Suppress shortcuts while typing, except the always-allowed allowlist.
    if (isEditableTarget(e.target) && !ALWAYS_ALLOWED.has(combo)) return;

    const id = resolveCombo(combo);
    if (!id) return;

    const command = getCommand(id);
    if (!command) return;

    // Do not preventDefault for a disabled command — let the key pass through.
    const ctx = buildCommandContext();
    if (command.when && !command.when(ctx)) return;

    e.preventDefault();
    run(id);
  });
}
