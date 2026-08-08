// Ordering helpers for the Timeline drag and the deck store.

/** A copy of `arr` with the item at `from` reinserted at `to`. */
export function movePosition<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/**
 * The node `insertBefore` should target to put `item` back at `oldIndex`,
 * given `siblings` as they stand *after* a drag library already moved it.
 *
 * The item must be excluded before indexing: it still occupies a slot, so
 * `siblings[oldIndex]` is off by one on backward drags (reverting E from
 * [A,E,B,C,D] at oldIndex 4 would yield ABCED rather than ABCDE).
 */
export function revertReference<T>(
  siblings: T[],
  item: T,
  oldIndex: number,
): T | null {
  const without = siblings.filter((n) => n !== item);
  return without[oldIndex] ?? null;
}
