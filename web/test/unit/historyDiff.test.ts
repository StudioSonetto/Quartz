import { describe, it, expect } from "vitest";
import { diffSlideState } from "~/utils/historyDiff";

const SLIDE = "slide-1";

const node = (id: string, over: Partial<any> = {}) =>
  ({
    id,
    slides: SLIDE,
    name: id,
    path: `root.${id}`,
    type: "core.text",
    reference: null,
    unsynced: null,
    locked: false,
    sort_order: 0,
    ...over,
  }) as any;

const comp = (nodeId: string, data: any) =>
  ({ node: nodeId, type: "core.transform", data }) as any;

const state = (nodes: any[], components: any[]): SlideState => ({
  nodes,
  components,
});

describe("diffSlideState", () => {
  it("marks a changed node dirty", () => {
    const ops = diffSlideState(
      state([node("a", { name: "after" })], []),
      state([node("a", { name: "before" })], []),
    );

    expect(ops.nodes).toEqual(["a"]);
    expect(ops.deletes).toEqual([]);
  });

  it("ignores a node that is identical in both", () => {
    const ops = diffSlideState(state([node("a")], []), state([node("a")], []));

    expect(ops.nodes).toEqual([]);
  });

  it("marks a node that only exists in the target dirty", () => {
    const ops = diffSlideState(state([], []), state([node("a")], []));

    expect(ops.nodes).toEqual(["a"]);
  });

  it("emits a delete for a node the target no longer has", () => {
    const ops = diffSlideState(state([node("a")], []), state([], []));

    expect(ops.deletes).toEqual([{ path: "root.a", slides: SLIDE, id: "a" }]);
    expect(ops.nodes).toEqual([]);
  });

  it("never emits a delete for the root node", () => {
    const ops = diffSlideState(
      state([node("r", { path: "root" }), node("a")], []),
      state([], []),
    );

    expect(ops.deletes).toEqual([{ path: "root.a", slides: SLIDE, id: "a" }]);
  });

  it("compares component data by value, not reference", () => {
    const ops = diffSlideState(
      state([], [comp("a", { x: 1 })]),
      state([], [comp("a", { x: 1 })]),
    );

    expect(ops.components).toEqual([]);
  });

  it("marks a changed component dirty", () => {
    const ops = diffSlideState(
      state([], [comp("a", { x: 1 })]),
      state([], [comp("a", { x: 2 })]),
    );

    expect(ops.components).toEqual([{ node: "a", type: "core.transform" }]);
  });

  it("emits a component delete when the target drops it", () => {
    const ops = diffSlideState(state([], [comp("a", { x: 1 })]), state([], []));

    expect(ops.componentDeletes).toEqual([
      { node: "a", type: "core.transform" },
    ]);
  });
});
