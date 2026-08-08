import { describe, expect, it } from "vitest";
import { movePosition, remapIndex } from "~/utils/slideOrder";

const base = ["A", "B", "C", "D", "E"];

// remapIndex's forward/backward branches are asymmetric, and a wrong edge pair
// only shows as the wrong slide being selected. The rest is browser-verified.
describe("remapIndex", () => {
  it("agrees with movePosition for every from/to pair", () => {
    for (let from = 0; from < base.length; from++) {
      for (let to = 0; to < base.length; to++) {
        const moved = movePosition(base, from, to);
        for (let i = 0; i < base.length; i++) {
          expect(remapIndex(i, from, to)).toBe(moved.indexOf(base[i]!));
        }
      }
    }
  });
});
