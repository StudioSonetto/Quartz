import { describe, it, expect } from "vitest";
import { nodeLabel, childPath } from "~/utils/nodePath";

// An ltree label allows only [A-Za-z0-9_], so a hyphen slipping through fails
// at Postgres, not in the UI.
describe("nodePath", () => {
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
