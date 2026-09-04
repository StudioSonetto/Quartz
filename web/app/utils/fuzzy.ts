function fuzzyMatch(query: string, target: string): number | null {
  if (query === "") return 0;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 - q.length;

  let qi = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }

  if (qi === q.length) return 100 - q.length;

  return null;
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  key: (t: T) => string,
): T[] {
  if (query === "") return items;

  const scored: { item: T; score: number }[] = [];

  for (const item of items) {
    const score = fuzzyMatch(query, key(item));

    if (score !== null) scored.push({ item, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
