import { describe, it, expect } from "vitest";
import { componentKey, buildSavePayload } from "./outbox";
import type { NodeModel, ComponentModel } from "#shared/types";

const node = (id: string): NodeModel => ({
  id,
  name: id,
  path: `root.n${id}`,
  reference: null,
  slides: "s",
  type: "group",
  sort_order: 0,
});

const comp = (nodeId: string): ComponentModel => ({
  node: nodeId,
  type: "transform",
  data: { x: 1 },
});

describe("outbox", () => {
  it("componentKey joins node and type", () => {
    expect(componentKey("abc", "transform")).toBe("abc:transform");
  });

  it("builds a payload by resolving dirty keys to current values", () => {
    const nodes = new Map([["a", node("a")]]);
    const comps = new Map([[componentKey("a", "transform"), comp("a")]]);

    const payload = buildSavePayload(
      {
        dirtyNodes: ["a"],
        deletedNodes: [{ path: "root.nb", slides: "s" }],
        dirtyComponents: [componentKey("a", "transform")],
      },
      (id) => nodes.get(id),
      (key) => comps.get(key),
    );

    expect(payload.nodesToUpsert).toEqual([
      { id: "a", slides: "s", name: "a", path: "root.na", reference: null, type: "group", sort_order: 0 },
    ]);
    expect(payload.nodesToDelete).toEqual([{ path: "root.nb", slides: "s" }]);
    expect(payload.componentsToUpsert).toEqual([comp("a")]);
  });

  it("skips dirty keys that no longer resolve (deleted locally)", () => {
    const payload = buildSavePayload(
      { dirtyNodes: ["gone"], deletedNodes: [], dirtyComponents: [componentKey("gone", "transform")] },
      () => undefined,
      () => undefined,
    );
    expect(payload.nodesToUpsert).toEqual([]);
    expect(payload.componentsToUpsert).toEqual([]);
  });
});
