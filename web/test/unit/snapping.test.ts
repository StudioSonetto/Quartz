import { describe, expect, it } from "vitest";
import { relatedIds } from "~/utils/snapping";

// Set logic that stays plausible while wrong: exclude self, descendants and
// ancestors but keep siblings, or dragging breaks only inside nested groups.
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
