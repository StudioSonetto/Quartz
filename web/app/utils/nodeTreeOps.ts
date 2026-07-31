import type { ComponentModel, NodeModel } from "#shared/types";
import {
  ROOT_PATH,
  childPath,
  isDescendantPath,
  isSelfOrDescendantPath,
  nodeLabel,
  parentPath,
} from "~/utils/nodePath";

export function nearestCommonAncestor(paths: string[]): string {
  if (!paths.length) return ROOT_PATH;

  const split = paths.map((p) => p.split("."));
  const first = split[0]!;

  let i = 0;

  for (; i < first.length; i++) {
    if (!split.every((s) => s[i] === first[i])) break;
  }

  const minLen = Math.min(...split.map((s) => s.length));
  const depth = Math.min(i, minLen - 1);

  return first.slice(0, Math.max(1, depth)).join(".") || ROOT_PATH;
}

function reroot(
  flat: NodeModel[],
  oldRoot: string,
  newRoot: string,
): NodeModel[] {
  return flat.map((node) => {
    if (node.path === oldRoot) return { ...node, path: newRoot };
    if (isDescendantPath(node.path, oldRoot))
      return { ...node, path: newRoot + node.path.slice(oldRoot.length) };

    return node;
  });
}

export function cloneSubtree(
  flat: NodeModel[],
  components: ComponentModel[],
  rootId: string,
  opts: { newSlides?: string; offset?: { x: number; y: number } } = {},
): { nodes: NodeModel[]; components: ComponentModel[] } {
  const root = flat.find((n) => n.id === rootId);

  if (!root) return { nodes: [], components: [] };

  const subtree = flat.filter((n) => isSelfOrDescendantPath(n.path, root.path));
  const idMap = new Map<string, string>();

  for (const n of subtree) idMap.set(n.id, crypto.randomUUID());

  const newRootPath = childPath(parentPath(root.path), idMap.get(rootId)!);

  const nodes: NodeModel[] = subtree.map((n) => {
    const newId = idMap.get(n.id)!;
    const rel = n.path === root.path ? "" : n.path.slice(root.path.length); // ".nx.ny"
    const relMapped = rel
      .split(".")
      .map((seg) => {
        if (!seg) return seg;
        const orig = subtree.find((s) => nodeLabel(s.id) === seg);
        return orig ? nodeLabel(idMap.get(orig.id)!) : seg;
      })
      .join(".");
    return {
      ...n,
      id: newId,
      slides: opts.newSlides ?? n.slides,
      path: newRootPath + relMapped,
    };
  });

  const newComponents: ComponentModel[] = [];
  for (const c of components) {
    if (!idMap.has(c.node)) continue;

    const data = JSON.parse(JSON.stringify(c.data));

    if (
      c.node === rootId &&
      c.type === "core.transform" &&
      opts.offset &&
      data.position
    ) {
      data.position.x = (data.position.x ?? 0) + opts.offset.x;
      data.position.y = (data.position.y ?? 0) + opts.offset.y;
    }
    newComponents.push({
      ...c,
      node: idMap.get(c.node)!,
      data,
    } as ComponentModel);
  }

  return { nodes, components: newComponents };
}

export function groupNodes(
  flat: NodeModel[],
  rootPaths: string[],
  group: NodeModel,
): NodeModel[] {
  let out = [...flat, group];
  for (const rp of rootPaths) {
    const node = out.find((n) => n.path === rp);
    if (!node) continue;
    out = reroot(out, rp, childPath(group.path, node.id));
  }
  return out;
}

export function ungroupNodes(flat: NodeModel[], groupId: string): NodeModel[] {
  const group = flat.find((n) => n.id === groupId);

  if (!group) return flat;

  const parentPrefix = parentPath(group.path);
  const groupDepth = group.path.split(".").length;

  let out = flat.filter((n) => n.id !== groupId);

  const children = out.filter(
    (n) =>
      isDescendantPath(n.path, group.path) &&
      n.path.split(".").length === groupDepth + 1,
  );

  for (const c of children) {
    out = reroot(out, c.path, childPath(parentPrefix, c.id));
  }
  return out;
}
