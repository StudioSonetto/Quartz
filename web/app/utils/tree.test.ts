import { describe, it, expect } from "vitest";
import { buildTree } from "./tree";
import type { NodeModel } from "#shared/types";

const node = (over: Partial<NodeModel>): NodeModel => ({
  id: over.id ?? "id",
  name: over.name ?? "n",
  path: over.path ?? "root",
  reference: over.reference ?? null,
  slides: over.slides ?? "s",
  type: over.type ?? "group",
  sort_order: over.sort_order ?? 0,
});

describe("buildTree", () => {
  it("returns an empty root when there is no root node", () => {
    const tree = buildTree([]);
    expect(tree.path).toBe("root");
    expect(tree.children).toEqual([]);
  });

  it("nests children under their parent by path", () => {
    const tree = buildTree([
      node({ id: "r", path: "root" }),
      node({ id: "a", path: "root.na", sort_order: 0 }),
      node({ id: "b", path: "root.na.nb", sort_order: 0 }),
    ]);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.id).toBe("a");
    expect(tree.children[0]!.children[0]!.id).toBe("b");
  });

  it("sorts siblings by sort_order ascending, not by insertion order", () => {
    const tree = buildTree([
      node({ id: "r", path: "root" }),
      node({ id: "x", path: "root.nx", sort_order: 2 }),
      node({ id: "y", path: "root.ny", sort_order: 0 }),
      node({ id: "z", path: "root.nz", sort_order: 1 }),
    ]);
    expect(tree.children.map((c) => c.id)).toEqual(["y", "z", "x"]);
  });

  it("breaks sort_order ties deterministically by id", () => {
    const tree = buildTree([
      node({ id: "r", path: "root" }),
      node({ id: "b", path: "root.nb", sort_order: 0 }),
      node({ id: "a", path: "root.na", sort_order: 0 }),
    ]);
    expect(tree.children.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
