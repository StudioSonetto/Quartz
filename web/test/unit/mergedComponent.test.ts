import { describe, expect, it } from "vitest";
import { commonComponentTypes, mergedValue } from "~/utils/mergedComponent";
import type { ComponentModel } from "#shared/types";

const c = (node: string, type: string, data: any): ComponentModel =>
  ({ node, type, data }) as ComponentModel;

describe("commonComponentTypes", () => {
  it("returns only types present on every node", () => {
    const byNode = [
      [c("1", "core.transform", {}), c("1", "core.typography", {})],
      [c("2", "core.transform", {})],
    ];
    expect(commonComponentTypes(byNode)).toEqual(["core.transform"]);
  });
});

describe("mergedValue", () => {
  const comps = [
    c("1", "core.typography", { size: 40, colour: "#111" }),
    c("2", "core.typography", { size: 40, colour: "#222" }),
  ];
  it("returns the shared value when equal", () => {
    expect(mergedValue(comps, ["size"])).toEqual({ value: 40, mixed: false });
  });
  it("flags mixed when they differ", () => {
    expect(mergedValue(comps, ["colour"])).toEqual({ value: undefined, mixed: true });
  });
});
