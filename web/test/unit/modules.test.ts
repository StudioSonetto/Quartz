import { describe, expect, it } from "vitest";
import { lockedModules } from "~~/shared/utils/modules";

describe("lockedModules", () => {
  it("never reports core", () => {
    expect(lockedModules(["core.text", "core.base"], [])).toEqual([]);
  });

  it("reports each locked module once", () => {
    expect(
      lockedModules(["paid.canvas", "paid.model", "core.text"], []),
    ).toEqual(["paid"]);
  });

  it("passes unlocked modules", () => {
    expect(lockedModules(["paid.canvas"], ["paid"])).toEqual([]);
  });
});
