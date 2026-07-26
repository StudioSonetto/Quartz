import { describe, it, expect } from "vitest";
import { componentKey, buildSavePayload } from "~/utils/outbox";
import type { NodeModel, ComponentModel } from "#shared/types";

const node = (id: string): NodeModel => ({
  id,
  name: id,
  path: `root.n${id}`,
  reference: null,
  slides: "s",
  type: "core.group",
  sort_order: 0,
});

const comp = (nodeId: string): ComponentModel => ({
  node: nodeId,
  type: "core.transform",
  data: { x: 1 },
});

describe("outbox", () => {
  it("componentKey joins node and type", () => {
    expect(componentKey("abc", "core.transform")).toBe("abc:core.transform");
  });

  it("builds a payload by resolving dirty keys to current values", () => {
    const nodes = new Map([["a", node("a")]]);
    const comps = new Map([[componentKey("a", "core.transform"), comp("a")]]);

    const payload = buildSavePayload(
      {
        dirtyNodes: ["a"],
        deletedNodes: [{ path: "root.nb", slides: "s" }],
        dirtyComponents: [componentKey("a", "core.transform")],
      },
      (id) => nodes.get(id),
      (key) => comps.get(key),
    );

    expect(payload.nodesToUpsert).toEqual([
      { id: "a", slides: "s", name: "a", path: "root.na", reference: null, type: "core.group", sort_order: 0 },
    ]);
    expect(payload.nodesToDelete).toEqual([{ path: "root.nb", slides: "s" }]);
    expect(payload.componentsToUpsert).toEqual([comp("a")]);
  });

  it("skips dirty keys that no longer resolve (deleted locally)", () => {
    const payload = buildSavePayload(
      { dirtyNodes: ["gone"], deletedNodes: [], dirtyComponents: [componentKey("gone", "core.transform")] },
      () => undefined,
      () => undefined,
    );
    expect(payload.nodesToUpsert).toEqual([]);
    expect(payload.componentsToUpsert).toEqual([]);
  });
});
