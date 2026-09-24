export function isNodeLocked(node: NodeModel | null | undefined): boolean {
  if (!node || node.path === ROOT_PATH) return false;

  return node.locked || !isModuleUnlocked(node.type);
}

export function unlockedOnly<T extends NodeModel>(nodes: T[]): T[] {
  return nodes.filter((n) => !isNodeLocked(n));
}
