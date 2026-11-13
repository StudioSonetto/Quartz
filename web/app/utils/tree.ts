export function stripTree(nodes: Tree[]): NodeModel[] {
  return nodes.map(({ children, parent, ...n }) => n);
}

export function* ancestors(node: Tree | null | undefined) {
  for (let n = node; n; n = n.parent ?? null) yield n;
}

export function nearestAccepting(
  node: Tree | null | undefined,
  type: NodeType,
): Tree | null {
  for (const n of ancestors(node)) if (canContain(n.type, type)) return n;

  return null;
}
