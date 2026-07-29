import { describe, expect, it } from "vitest";
import { snapCandidates, resolveSnap, relatedIds } from "~/utils/snapping";

const canvas = { width: 1920, height: 1080 };

describe("snapCandidates", () => {
  it("emits left/centre/right + top/middle/bottom per box, plus canvas centre", () => {
    const lines = snapCandidates(
      [{ left: 100, top: 100, width: 200, height: 100 }],
      canvas,
    );
    const xs = lines.filter((l) => l.axis === "x").map((l) => l.pos);
    const ys = lines.filter((l) => l.axis === "y").map((l) => l.pos);
    expect(xs).toEqual(expect.arrayContaining([100, 200, 300, 960])); // + canvas centre 960
    expect(ys).toEqual(expect.arrayContaining([100, 150, 200, 540]));
  });
});

describe("resolveSnap", () => {
  const cands = snapCandidates(
    [{ left: 100, top: 0, width: 200, height: 100 }],
    canvas,
  );
  it("snaps left edge to a candidate within threshold", () => {
    const box = { left: 108, top: 500, width: 50, height: 50 };
    const got = resolveSnap(box, cands, 10);
    expect(got.left).toBe(100);
    expect(got.matched.some((m) => m.axis === "x" && m.pos === 100)).toBe(true);
  });
  it("leaves the box when nothing is within threshold", () => {
    const box = { left: 500, top: 500, width: 50, height: 50 };
    const got = resolveSnap(box, cands, 10);
    expect(got.left).toBe(500);
    expect(got.top).toBe(500);
  });
  it("spans a matched element line across both boxes", () => {
    // Source box is y 0..100; moving box lands at y 500..550, so the guide
    // should reach from 0 to 550 (not the full canvas).
    const box = { left: 108, top: 500, width: 50, height: 50 };
    const got = resolveSnap(box, cands, 10);
    const line = got.matched.find((m) => m.axis === "x" && m.pos === 100);
    expect(line?.from).toBe(0);
    expect(line?.to).toBe(550);
  });
});

describe("relatedIds", () => {
  const nodes = [
    { id: "root", path: "root" },
    { id: "g", path: "root.ng" },
    { id: "a", path: "root.ng.na" },
    { id: "b", path: "root.ng.nb" },
    { id: "c", path: "root.nc" },
  ];

  it("excludes a moving node, its descendants and its ancestors", () => {
    const got = relatedIds(nodes, ["g"]);
    expect([...got].sort()).toEqual(["a", "b", "g", "root"]);
  });

  it("leaves unrelated siblings snappable", () => {
    const got = relatedIds(nodes, ["a"]);
    expect(got.has("a")).toBe(true); // self
    expect(got.has("g")).toBe(true); // ancestor
    expect(got.has("root")).toBe(true); // ancestor
    expect(got.has("b")).toBe(false); // sibling — stays a target
    expect(got.has("c")).toBe(false); // unrelated branch
  });
});
