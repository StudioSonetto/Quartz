import { describe, expect, it } from "vitest";
import { rangeIds, outermostNodes, rectsIntersect } from "~/utils/selection";
import type { Tree } from "#shared/types";

const t = (id: string, path: string): Tree =>
  ({ id, path, children: [] }) as unknown as Tree;

describe("rangeIds", () => {
  const order = ["a", "b", "c", "d"];
  it("slices inclusive, anchor before target", () => {
    expect(rangeIds(order, "b", "d")).toEqual(["b", "c", "d"]);
  });
  it("slices inclusive, anchor after target", () => {
    expect(rangeIds(order, "d", "b")).toEqual(["b", "c", "d"]);
  });
  it("returns empty when an id is missing", () => {
    expect(rangeIds(order, "b", "z")).toEqual([]);
  });
});

describe("outermostNodes", () => {
  it("drops descendants of selected ancestors", () => {
    const parent = t("p", "root.np");
    const child = t("c", "root.np.nc");
    const sibling = t("s", "root.ns");
    const got = outermostNodes([parent, child, sibling]).map((n) => n.id);
    expect(got.sort()).toEqual(["p", "s"]);
  });
});

describe("rectsIntersect", () => {
  it("true when overlapping", () => {
    expect(
      rectsIntersect(
        { left: 0, top: 0, width: 10, height: 10 },
        { left: 5, top: 5, width: 10, height: 10 },
      ),
    ).toBe(true);
  });
  it("false when disjoint", () => {
    expect(
      rectsIntersect(
        { left: 0, top: 0, width: 10, height: 10 },
        { left: 20, top: 0, width: 10, height: 10 },
      ),
    ).toBe(false);
  });
});
