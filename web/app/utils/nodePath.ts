export const ROOT_PATH = "root";

export function nodeLabel(id: string): string {
  return `n${id.replaceAll("-", "")}`;
}

export function childPath(parentPath: string, id: string): string {
  return `${parentPath}.${nodeLabel(id)}`;
}
