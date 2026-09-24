import { describe, expect, it } from "vitest";
import { lockedModules, moduleOf } from "~~/shared/utils/modules";

describe("moduleOf", () => {
  it("takes the part before the dot", () => {
    expect(moduleOf("core.text")).toBe("core");
    expect(moduleOf("paid.canvas")).toBe("paid");
  });
});

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
