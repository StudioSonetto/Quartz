export function isNodeLocked(node: NodeModel | null | undefined): boolean {
  return !!node?.locked && node.path !== ROOT_PATH;
}

export function unlockedOnly<T extends NodeModel>(nodes: T[]): T[] {
  return nodes.filter((n) => !isNodeLocked(n));
}
