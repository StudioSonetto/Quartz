export const ROOT_PATH = ROOT_NODE_PATH;

export function nodeLabel(id: string): string {
  return `n${id.replaceAll("-", "")}`;
}

export function childPath(parentPath: string, id: string): string {
  return `${parentPath}.${nodeLabel(id)}`;
}

export function parentPath(path: string): string {
  return path.split(".").slice(0, -1).join(".");
}

export function isDescendantPath(path: string, ancestor: string): boolean {
  return path.startsWith(`${ancestor}.`);
}

export function isSelfOrDescendantPath(
  path: string,
  ancestor: string,
): boolean {
  return path === ancestor || isDescendantPath(path, ancestor);
}
