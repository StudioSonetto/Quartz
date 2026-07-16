import { describe, it, expect } from "vitest";
import { ROOT_PATH, nodeLabel, childPath } from "~/utils/nodePath";

describe("nodePath", () => {
  it("ROOT_PATH is 'root'", () => {
    expect(ROOT_PATH).toBe("root");
  });

  it("nodeLabel strips UUID hyphens and prefixes 'n'", () => {
    expect(nodeLabel("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "n550e8400e29b41d4a716446655440000",
    );
  });

  it("nodeLabel output is a valid ltree label ([A-Za-z0-9_])", () => {
    expect(nodeLabel("550e8400-e29b-41d4-a716-446655440000")).toMatch(
      /^[A-Za-z0-9_]+$/,
    );
  });

  it("childPath appends the node label under the parent path", () => {
    expect(childPath("root", "550e8400-e29b-41d4-a716-446655440000")).toBe(
      "root.n550e8400e29b41d4a716446655440000",
    );
    expect(childPath("root.nabc", "11111111-1111-1111-1111-111111111111")).toBe(
      "root.nabc.n11111111111111111111111111111111",
    );
  });
});
