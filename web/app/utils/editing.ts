export function isNodeEditing(node: Tree | null | undefined): boolean {
  return !!node && !!getNodeType(node.type)?.editing?.(node);
}
