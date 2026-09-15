import { describe, it, expect } from "vitest";

function comp(node: string, type: string, data: any) {
  return { node, type, data } as any;
}

describe("renameState", () => {
  it("rewrites the key in place, so the state list keeps its order", () => {
    const base = comp("n1", "core.base", {
      states: {
        a: { overrides: {} },
        old: { overrides: {} },
        z: { overrides: {} },
      },
    });

    const [changed] = renameState([base], "old", "new");

    expect(Object.keys(changed!.data.states)).toEqual(["a", "new", "z"]);
  });

  it("rewrites the handlers naming it, so events do not fire into nothing", () => {
    const events = comp("n1", "core.event", {
      handlers: [
        { on: "click", action: "toggleState", state: "old" },
        { on: "hover", action: "setState", state: "other" },
      ],
    });

    const [changed] = renameState([events], "old", "new");

    expect(changed!.data.handlers[0].state).toBe("new");
    expect(changed!.data.handlers[1].state).toBe("other");
  });

  it("rewrites the state keys naming it, so the schedule follows the rename", () => {
    const anim = comp("n1", "core.animation", {
      tracks: [],
      stateKeys: [
        { t: 0, name: "" },
        { t: 800, name: "old" },
      ],
    });

    const [changed] = renameState([anim], "old", "new");

    expect(changed!.data.stateKeys[1].name).toBe("new");
  });

  it("returns nothing when no component mentions the old name", () => {
    const base = comp("n1", "core.base", { states: { a: { overrides: {} } } });

    expect(renameState([base], "old", "new")).toEqual([]);
  });
});
