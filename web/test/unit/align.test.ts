import { describe, expect, it } from "vitest";
import {
  alignPositions,
  distributePositions,
  type NodeRect,
} from "~/utils/align";

const rects: NodeRect[] = [
  { id: "a", left: 0, top: 0, width: 100, height: 40 },
  { id: "b", left: 200, top: 100, width: 60, height: 20 },
];
const frame = { left: 0, top: 0, width: 500, height: 300 };

describe("alignPositions within selection bbox", () => {
  const bbox = { left: 0, top: 0, width: 260, height: 120 };
  it("left aligns all to bbox left", () => {
    const got = alignPositions(rects, "left", bbox);
    expect(got.a.left).toBe(0);
    expect(got.b.left).toBe(0);
  });
  it("right aligns all to bbox right edge", () => {
    const got = alignPositions(rects, "right", bbox);
    expect(got.a.left).toBe(160);
    expect(got.b.left).toBe(200);
  });
  it("centreH centres each on bbox centre", () => {
    const got = alignPositions(rects, "centreH", bbox);
    expect(got.a.left).toBe(80);
    expect(got.b.left).toBe(100);
  });
});

describe("alignPositions to canvas frame (single select)", () => {
  it("centres one rect on the canvas", () => {
    const got = alignPositions([rects[0]], "centreH", frame);
    expect(got.a.left).toBe(200);
  });
});

describe("distributePositions", () => {
  it("evenly spaces three by centre on the h axis", () => {
    const three: NodeRect[] = [
      { id: "a", left: 0, top: 0, width: 20, height: 20 },
      { id: "b", left: 40, top: 0, width: 20, height: 20 },
      { id: "c", left: 200, top: 0, width: 20, height: 20 },
    ];
    const got = distributePositions(three, "h");
    expect(got.a.left).toBe(0);
    expect(got.c.left).toBe(200);
    expect(got.b.left).toBe(100);
  });
});
