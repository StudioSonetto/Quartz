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
