import { describe, expect, it } from "vitest";
import { allEqual, mergedValue, setNested } from "~/utils/mergedComponent";
import type { ComponentModel } from "#shared/types";

const c = (node: string, type: string, data: any): ComponentModel =>
  ({ node, type, data }) as ComponentModel;

describe("mergedValue", () => {
  const comps = [
    c("1", "core.typography", { size: 40, colour: "#111" }),
    c("2", "core.typography", { size: 40, colour: "#222" }),
  ];
  it("returns the shared value when equal", () => {
    expect(mergedValue(comps, ["size"])).toBe(40);
  });
  it("returns undefined when they differ", () => {
    expect(mergedValue(comps, ["colour"])).toBeUndefined();
  });
});

describe("setNested", () => {
  it("sets a nested key without mutating the input", () => {
    const data = { position: { x: 1, y: 2 }, size: "auto" };
    const next = setNested(data, ["position", "x"], 9);
    expect(next.position.x).toBe(9);
    expect(next.position.y).toBe(2);
    expect(next.size).toBe("auto");
    expect(data.position.x).toBe(1); // original untouched
  });

  it("sets a top-level key", () => {
    const next = setNested({ mode: "free" }, ["mode"], "grid");
    expect(next.mode).toBe("grid");
  });
});

describe("allEqual", () => {
  it("returns the shared value when all agree", () => {
    expect(allEqual(["auto", "auto"], undefined)).toBe("auto");
  });
  it("returns the mixed sentinel when they differ", () => {
    expect(allEqual(["auto", "fixed"], undefined)).toBe(undefined);
    expect(allEqual(["a", "b"], "")).toBe("");
  });
  it("returns the mixed sentinel for an empty list", () => {
    expect(allEqual([], "")).toBe("");
  });
});
