import { onKeyStroke } from "@vueuse/core";
import { eventToCombo } from "~/utils/keyCombo";
import { resolveCombo } from "~/utils/keymap";
import { getCommand } from "~/modules/registry";
import { buildCommandContext } from "~/composables/commandContext";
import { isEditableTarget } from "~/utils/dom";

const ALWAYS_ALLOWED = new Set(["mod+k", "escape"]);

export function useKeybindings() {
  const { run } = useCommands();

  onKeyStroke((e: KeyboardEvent) => {
    // A local handler that already claimed this key marks it handled. Honouring
    // that here is what lets panel handlers just preventDefault, instead of each
    // one having to stopPropagation to keep this listener from firing too.
    if (e.defaultPrevented) return;

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
