import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyFilter } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("empty query scores 0 (matches anything)", () => {
    expect(fuzzyMatch("", "anything")).toBe(0);
  });
  it("ranks exact > prefix > subsequence", () => {
    const exact = fuzzyMatch("add", "add")!;
    const prefix = fuzzyMatch("add", "add group")!;
    const subseq = fuzzyMatch("ag", "add group")!;
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(subseq);
  });
  it("returns null when not a subsequence", () => {
    expect(fuzzyMatch("xyz", "add group")).toBeNull();
  });
  it("ties same-tier matches so filter preserves input order", () => {
    // Two prefix matches of different lengths score equally (500 - query.length),
    // so fuzzyFilter's stable sort keeps registration/input order.
    expect(fuzzyMatch("add", "add text")).toBe(fuzzyMatch("add", "add group"));
  });
});

describe("fuzzyFilter", () => {
  const items = [{ n: "Add Group" }, { n: "Add Text" }, { n: "Delete Node" }];
  it("empty query returns all unchanged", () => {
    expect(fuzzyFilter(items, "", (i) => i.n)).toEqual(items);
  });
  it("filters and ranks case-insensitively", () => {
    const out = fuzzyFilter(items, "add", (i) => i.n).map((i) => i.n);
    expect(out).toEqual(["Add Group", "Add Text"]);
  });
});
