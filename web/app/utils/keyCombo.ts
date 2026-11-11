const MODIFIER_KEYS = new Set(["control", "meta", "alt", "shift"]);

export function eventToCombo(
  e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">,
): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("mod");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");

  const key = e.key.toLowerCase();
  if (!MODIFIER_KEYS.has(key)) parts.push(key);

  return parts.join("+");
}

const IS_MAC = import.meta.client && /mac/i.test(navigator.platform);
const MAC_KEYS: Record<string, string> = { mod: "⌘", shift: "⇧", alt: "⌥" };
const KEY_NAMES: Record<string, string> = {
  mod: "Ctrl",
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  backspace: "⌫",
  delete: "Del",
  escape: "Esc",
};

export function formatShortcut(combo?: string) {
  return combo
    ?.split("+")
    .map(
      (key) =>
        (IS_MAC && MAC_KEYS[key]) ||
        KEY_NAMES[key] ||
        key.charAt(0).toUpperCase() + key.slice(1),
    )
    .join(IS_MAC ? "" : "+");
}
