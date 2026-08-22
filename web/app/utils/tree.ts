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
      unsynced: null,
      locked: false,
      type: "core.group",
      sort_order: 0,
      children: [],
    }
  );
}

const NONE: ReadonlySet<string> = new Set();

export function flattenTree(
  node: Tree,
  collapsedIds: ReadonlySet<string> = NONE,
): Tree[] {
  const out: Tree[] = [];

  const walk = (current: Tree) => {
    out.push(current);

    if (collapsedIds.has(current.id)) return;

    for (const child of current.children) walk(child);
  };

  walk(node);

  return out;
}
