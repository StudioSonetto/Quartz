// Ordering arithmetic shared by the Timeline drag and the deck store.
// Pure and DOM-free so the index maths can be tested directly — the
// forward/backward asymmetry below is not obvious by inspection.

/** A copy of `arr` with the item at `from` reinserted at `to`. */
export function movePosition<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Where the item currently at `i` lands after `movePosition(_, from, to)`. */
export function remapIndex(i: number, from: number, to: number): number {
  if (i === from) return to;
  if (from < to) return i > from && i <= to ? i - 1 : i;
  return i >= to && i < from ? i + 1 : i;
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
