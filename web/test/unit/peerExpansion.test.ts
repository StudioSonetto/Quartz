import { describe, it, expect } from "vitest";
import { expandComponentsToPeers } from "../../server/utils/peers";

const row = (node: string, type: string, data: Record<string, any>) => ({
  node,
  type,
  data,
});

const peers =
  (map: Record<string, string[]>, unsynced: Record<string, string[]> = {}) =>
  (node: string, type: string) =>
    unsynced[node]?.includes(type) ? [] : (map[node] ?? []);

describe("expandComponentsToPeers", () => {
  it("returns rows untouched when there are no peers", () => {
    const rows = [row("a", "core.transform", { x: 1 })];
    expect(expandComponentsToPeers(rows, peers({}))).toEqual(rows);
  });

  it("copies each row onto every peer", () => {
    const rows = [row("a", "core.transform", { x: 1 })];
    const out = expandComponentsToPeers(rows, peers({ a: ["b", "c"] }));

    expect(out.map((r) => r.node)).toEqual(["a", "b", "c"]);
    expect(out.every((r) => r.data.x === 1)).toBe(true);
  });

  // The client fans out too, so a request routinely carries rows for several
  // peers of one group — and Postgres rejects a statement that writes a row twice.
  it("emits one row per node+type when peers are already present in the input", () => {
    const rows = [
      row("a", "core.transform", { x: 1 }),
      row("b", "core.transform", { x: 1 }),
    ];
    const out = expandComponentsToPeers(rows, peers({ a: ["b"], b: ["a"] }));

    expect(out).toHaveLength(2);
    expect(new Set(out.map((r) => `${r.node}:${r.type}`)).size).toBe(2);
  });

  // A row the client sent for a node is that node's own state; a copy fanned
  // out from one of its peers must not silently replace it.
  it("keeps a node's own row over a copy fanned out from its peer", () => {
    const rows = [
      row("a", "core.transform", { x: 1 }),
      row("b", "core.transform", { x: 2 }),
    ];
    const out = expandComponentsToPeers(rows, peers({ a: ["b"], b: ["a"] }));

    expect(out).toHaveLength(2);
    expect(out.find((r) => r.node === "a")!.data).toEqual({ x: 1 });
    expect(out.find((r) => r.node === "b")!.data).toEqual({ x: 2 });
  });

  it("keeps rows of different types on the same node separate", () => {
    const rows = [
      row("a", "core.transform", { x: 1 }),
      row("a", "core.typography", { size: 2 }),
    ];
    const out = expandComponentsToPeers(rows, peers({ a: ["b"] }));

    expect(out).toHaveLength(4);
    expect(out.filter((r) => r.node === "b").map((r) => r.type).sort()).toEqual([
      "core.transform",
      "core.typography",
    ]);
  });

  it("leaves an unsynced type on its own node", () => {
    const rows = [
      row("a", "core.transform", { x: 1 }),
      row("a", "core.typography", { size: 2 }),
    ];
    const out = expandComponentsToPeers(
      rows,
      peers({ a: ["b"] }, { a: ["core.transform"] }),
    );

    expect(out.filter((r) => r.node === "b").map((r) => r.type)).toEqual([
      "core.typography",
    ]);
  });

  it("gives every emitted row its own data object", () => {
    const rows = [row("a", "core.transform", { position: { x: 1 } })];
    const out = expandComponentsToPeers(rows, peers({ a: ["b"] }));

    expect(out[1]!.data).not.toBe(out[0]!.data);
    out[0]!.data.position.x = 9;
    expect(out[1]!.data.position.x).toBe(1);
  });
});
