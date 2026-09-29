import { describe, it, expect, beforeEach } from "vitest";
import { registerModule, __resetRegistry } from "~/modules/registry";

describe("keyedPaths", () => {
  beforeEach(() => {
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [],
      componentTypes: [
        { type: "core.image", unkeyed: ["start", "duration"] } as any,
      ],
    });
  });

  it("never keys a field its type marks unkeyed", () => {
    expect(
      keyedPaths(
        "core.image",
        { start: 0, duration: 0, volume: 1 },
        { start: 500, duration: 4000, volume: 0.5 },
      ),
    ).toEqual([["volume"]]);
  });
});
