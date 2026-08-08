import { describe, expect, it } from "vitest";
import { setNested } from "~/utils/mergedComponent";

// If setNested mutated its input, editing one node in a multi-selection would
// corrupt the others' stored data — visible only on opening a different node.
describe("setNested", () => {
  it("sets a nested key without mutating the input", () => {
    const data = { position: { x: 1, y: 2 }, size: "auto" };
    const next = setNested(data, ["position", "x"], 9);
    expect(next.position.x).toBe(9);
    expect(next.position.y).toBe(2);
    expect(next.size).toBe("auto");
    expect(data.position.x).toBe(1); // original untouched
  });
});
