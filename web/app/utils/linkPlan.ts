// What a node contributes to a link decision: its type, plus the state peers
// must hold in common — name and component data, never children or position
// in the tree.
export interface LinkCandidate {
  id: string;
  type: string;
  name: string;
  // Not synced state; here only to enforce one peer per slide.
  slides: string;
  data: Record<string, Record<string, any>>;
}

export type LinkPlan =
  | { kind: "clear" }
  | { kind: "link" }
  | { kind: "reject"; reason: string }
  | { kind: "choose" };

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;

  return ka.every(
    (k) =>
      Object.hasOwn(b as object, k) && deepEqual((a as any)[k], (b as any)[k]),
  );
}

function sameState(a: LinkCandidate, b: LinkCandidate): boolean {
  return a.name === b.name && deepEqual(a.data, b.data);
}

// Decide what committing `key` on `selection` should do. Judges the whole
// prospective group: a multi-selection can be divergent with no peers at all.
export function planLink(
  selection: LinkCandidate[],
  peers: LinkCandidate[],
  key: string,
): LinkPlan {
  if (!key) return { kind: "clear" };

  const group = [...selection, ...peers];
  if (group.length < 2) return { kind: "link" };

  const types = new Set(group.map((c) => c.type));
  if (types.size > 1) {
    return {
      kind: "reject",
      reason: `Can't share "${key}" across different node types (${[...types].join(", ")}).`,
    };
  }

  // Peers converge on `core.transform`, so two on one slide would sit on top of
  // each other and drag as one. Paste guards this too, by clearing the key.
  const bySlides = new Set<string>();
  for (const c of group) {
    if (bySlides.has(c.slides)) {
      return {
        kind: "reject",
        reason: `Can't share "${key}" between two nodes on the same slide.`,
      };
    }
    bySlides.add(c.slides);
  }

  const first = group[0]!;
  return group.every((c) => sameState(first, c))
    ? { kind: "link" }
    : { kind: "choose" };
}
