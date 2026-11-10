export function isNodeLocked(node: NodeModel | null | undefined): boolean {
  if (!node || node.path === ROOT_PATH) return false;

  return node.locked || !isModuleUnlocked(node.type);
}

export function unlockedOnly<T extends NodeModel>(nodes: T[]): T[] {
  return nodes.filter((n) => !isNodeLocked(n));
}

export function withoutLockedModules<
  T extends { nodes: NodeModel[]; components: ComponentModel[] },
>(entry: T): T {
  const locked = entry.nodes
    .filter((n) => !isModuleUnlocked(n.type))
    .map((n) => n.path);

  if (!locked.length) return entry;

  const nodes = entry.nodes.filter(
    (n) => !locked.some((p) => isSelfOrDescendantPath(n.path, p)),
  );
  const ids = new Set(nodes.map((n) => n.id));

  return {
    ...entry,
    nodes,
    components: entry.components.filter((c) => ids.has(c.node)),
  };
}
