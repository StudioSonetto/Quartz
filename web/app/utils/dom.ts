// True for elements that own their own keystrokes — text entry, and number
// inputs whose arrows step the value. Keyboard handlers check this before
// claiming a key so typing and caret movement keep working.
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;

  if (!el) return false;

  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable === true
  );
}

// Step `i` by `delta` around a list of length `n`, wrapping at both ends. An
// index of -1 (nothing current) enters from whichever end we are moving from.
export function wrapIndex(i: number, delta: number, n: number): number {
  if (n === 0) return -1;
  if (i < 0) return delta > 0 ? 0 : n - 1;

  return (i + delta + n) % n;
}
