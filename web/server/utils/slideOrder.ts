export type OrderCheck =
  | { ok: true }
  | { ok: false; reason: "length" | "duplicate" | "foreign" };

/**
 * Verify a submitted slide ordering is exactly a permutation of the deck's
 * real slides.
 *
 * A client that missed a realtime INSERT or DELETE would otherwise silently
 * drop a slide from the deck's numbering, so this is a hard reject rather
 * than a best-effort merge.
 */
export function checkSlideOrder(
  currentIds: string[],
  order: string[],
): OrderCheck {
  if (order.length !== currentIds.length) return { ok: false, reason: "length" };

  if (new Set(order).size !== order.length) {
    return { ok: false, reason: "duplicate" };
  }

  const known = new Set(currentIds);
  if (order.some((id) => !known.has(id))) {
    return { ok: false, reason: "foreign" };
  }

  return { ok: true };
}
