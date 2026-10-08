import { describe, it, expect } from "vitest";

const node = (id: string, type: string, name: string) =>
  ({ id, type, name }) as Pick<Tree, "id" | "type" | "name">;

describe("magicNames", () => {
  it("names each unique type + name", () => {
    const names = magicNames([
      node("a", "core.text", "Title"),
      node("b", "core.shape", "Title"),
    ]);

    expect(names.size).toBe(2);
    expect(names.get("a")).not.toBe(names.get("b"));
  });

  it("gives the same name on two slides for the same type + name", () => {
    const before = magicNames([node("a", "core.text", "Title")]);
    const after = magicNames([node("z", "core.text", "Title")]);

    expect(before.get("a")).toBe(after.get("z"));
  });

  it("skips a type + name that appears twice, since duplicate names abort the transition", () => {
    const names = magicNames([
      node("a", "core.text", "Card"),
      node("b", "core.text", "Card"),
      node("c", "core.text", "Other"),
    ]);

    expect([...names.keys()]).toEqual(["c"]);
  });

  it("produces valid CSS idents for any name", () => {
    const names = magicNames([node("a", "core.text", "Héllo wörld! 2/3")]);

    expect(names.get("a")).toMatch(/^[a-zA-Z_][a-zA-Z0-9_-]*$/);
  });
});

describe("transitionHandler", () => {
  it("finds the enter → transition handler", () => {
    const handler = {
      on: "enter",
      action: "transition",
      kind: "push",
    } as EventHandler;

    expect(
      transitionHandler([
        { on: "click", action: "nextSlide" } as EventHandler,
        handler,
      ]),
    ).toBe(handler);
  });

  it("ignores a transition on another trigger", () => {
    expect(
      transitionHandler([{ on: "click", action: "transition" } as EventHandler]),
    ).toBeUndefined();
  });
});

describe("cssEasing", () => {
  it("samples the easing into a linear() function from 0 to 1", () => {
    const css = cssEasing("ease-out", 400);

    expect(css.startsWith("linear(0, ")).toBe(true);
    expect(css.endsWith(", 1)")).toBe(true);
  });
});
