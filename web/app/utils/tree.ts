import type { NodeModel, Tree } from "#shared/types";
import { ROOT_PATH } from "./nodePath";

export function buildTree(nodes: NodeModel[]): Tree {
  const lookup: Record<string, Tree> = {};

  for (const node of nodes) {
    lookup[node.path] = { ...node, children: [] };
  }

  for (const treeNode of Object.values(lookup)) {
    const parentPath = treeNode.path.split(".").slice(0, -1).join(".");
    const parent = lookup[parentPath];
    if (parent) {
      treeNode.parent = parent;
      parent.children.push(treeNode);
    }
  }

  for (const treeNode of Object.values(lookup)) {
    treeNode.children.sort(
      (a, b) =>
        a.sort_order - b.sort_order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  }

  return (
    lookup[ROOT_PATH] ?? {
      id: "",
      slides: "",
      name: "",
      path: ROOT_PATH,
      reference: null,
      type: "group",
      sort_order: 0,
      children: [],
    }
  );
}
