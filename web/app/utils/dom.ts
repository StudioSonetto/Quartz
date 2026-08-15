export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;

  if (!el) return false;

  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable === true
  );
}

export function isInsideOpenDialog(target: EventTarget | null): boolean {
  const el = target as Element | null;

  return !!el?.closest?.("dialog[open]");
}

export function wrapIndex(i: number, delta: number, n: number): number {
  if (n === 0) return -1;
  if (i < 0) return delta > 0 ? 0 : n - 1;

  return (i + delta + n) % n;
}
