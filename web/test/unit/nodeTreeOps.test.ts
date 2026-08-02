import { describe, expect, it } from "vitest";
import {
  nearestCommonAncestor,
  cloneSubtree,
  groupNodes,
  ungroupNodes,
  canonicaliseSortOrder,
} from "~/utils/nodeTreeOps";
import { childPath, nodeLabel, ROOT_PATH } from "~/utils/nodePath";
import type { ComponentModel, NodeModel } from "#shared/types";

const n = (
  id: string,
  path: string,
  extra: Partial<NodeModel> = {},
): NodeModel =>
  ({
    id,
    slides: "s1",
    name: id,
    path,
    type: "core.text",
    reference: null,
    sort_order: 0,
    ...extra,
  }) as NodeModel;

describe("nearestCommonAncestor", () => {
  it("returns the shared prefix", () => {
    expect(nearestCommonAncestor(["root.na.nb", "root.na.nc"])).toBe("root.na");
  });
  it("falls back to root when they diverge at top", () => {
    expect(nearestCommonAncestor(["root.na", "root.nb"])).toBe("root");
  });
});

describe("canonicaliseSortOrder", () => {
  it("renumbers a parent's children to gap-free 0..n in array order, breaking collisions", () => {
    const flat = [
      n("root", ROOT_PATH, { sort_order: 0, type: "core.group" }),
      n("a", "root.na", { sort_order: 5 }),
      n("b", "root.nb", { sort_order: 5 }), // collides with a
      n("c", "root.nc", { sort_order: 2 }),
    ];
    const order = Object.fromEntries(
      canonicaliseSortOrder(flat).map((x) => [x.id, x.sort_order]),
    );
    expect(order).toMatchObject({ a: 0, b: 1, c: 2 });
  });

  it("numbers each parent independently and leaves the root's order untouched", () => {
    const flat = [
      n("root", ROOT_PATH, { sort_order: 7, type: "core.group" }),
      n("g", "root.ng", { sort_order: 3, type: "core.group" }),
      n("x", "root.ng.nx", { sort_order: 9 }),
      n("y", "root.ng.ny", { sort_order: 9 }),
    ];
    const byId = Object.fromEntries(
      canonicaliseSortOrder(flat).map((x) => [x.id, x.sort_order]),
    );
    expect(byId).toMatchObject({ root: 7, g: 0, x: 0, y: 1 });
  });

  it("returns the same node reference when its order is already canonical", () => {
    const a = n("a", "root.na", { sort_order: 0 });
    expect(canonicaliseSortOrder([a])[0]).toBe(a);
  });
});

describe("cloneSubtree", () => {
  it("clones with fresh ids, remapped paths, offset on the root transform", () => {
    const root = n("r", "root.nr", { type: "core.group" });
    const child = n("c", "root.nr.nc");
    const comps: ComponentModel[] = [
      {
        node: "r",
        type: "core.transform",
        data: { position: { x: 10, y: 10 }, size: {}, rotation: 0, scale: 1 },
      } as ComponentModel,
      {
        node: "c",
        type: "core.typography",
        data: { size: 40 },
      } as ComponentModel,
    ];
    const out = cloneSubtree([root, child], comps, "r", {
      offset: { x: 24, y: 24 },
    });
    expect(out.nodes).toHaveLength(2);
    const newRoot = out.nodes.find((x) => x.name === "r")!;
    expect(newRoot.id).not.toBe("r");
    expect(out.rootId).toBe(newRoot.id);
    expect(newRoot.path).toBe(`root.${nodeLabel(newRoot.id)}`);
    const newChild = out.nodes.find((x) => x.name === "c")!;
    expect(newChild.path).toBe(childPath(newRoot.path, newChild.id));
    const rt = out.components.find(
      (c) => c.node === newRoot.id && c.type === "core.transform",
    )!;
    expect(rt.data.position).toEqual({ x: 34, y: 34 });
    expect(out.components.some((c) => c.node === newChild.id)).toBe(true);
  });
});

describe("groupNodes", () => {
  it("re-roots siblings under a new group", () => {
    const a = n("a", "root.na");
    const b = n("b", "root.nb");
    const group = n("g", "root.ng", { type: "core.group" });
    const out = groupNodes([a, b, group], ["root.na", "root.nb"], group);
    const na = out.find((x) => x.id === "a")!;
    const nb = out.find((x) => x.id === "b")!;
    expect(na.path).toBe(childPath("root.ng", "a"));
    expect(nb.path).toBe(childPath("root.ng", "b"));
  });
});

describe("ungroupNodes", () => {
  it("lifts children to the group's parent and drops the group", () => {
    const group = n("g", "root.ng", { type: "core.group" });
    const child = n("c", "root.ng.nc");
    const out = ungroupNodes([group, child], "g");
    expect(out.find((x) => x.id === "g")).toBeUndefined();
    expect(out.find((x) => x.id === "c")!.path).toBe(childPath("root", "c"));
  });
});
