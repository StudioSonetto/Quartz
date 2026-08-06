export const ROOT_PATH = "root";

export function nodeLabel(id: string): string {
  return `n${id.replaceAll("-", "")}`;
}

export function childPath(parentPath: string, id: string): string {
  return `${parentPath}.${nodeLabel(id)}`;
}

// Inverse of childPath: the parent's materialised path (drops the last label).
export function parentPath(path: string): string {
  return path.split(".").slice(0, -1).join(".");
}

// True when `path` sits strictly below `ancestor` in the tree.
export function isDescendantPath(path: string, ancestor: string): boolean {
  return path.startsWith(`${ancestor}.`);
}

// True when `path` is `ancestor` itself or any node in its subtree.
export function isSelfOrDescendantPath(path: string, ancestor: string): boolean {
  return path === ancestor || isDescendantPath(path, ancestor);
}
