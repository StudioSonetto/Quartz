import { describe, expect, it } from "vitest";
import { dependencies, evaluate, parse } from "~/utils/expression";
import type { Scope, VariableDef } from "~/utils/expression";

describe("parse", () => {
  it("reads a hex colour as a literal, not a comment or an error", () => {
    expect(parse("#151515")).toEqual({ kind: "colour", value: "#151515" });
  });

  it("treats dots as part of a name, not member access", () => {
    expect(parse("brand.primary")).toEqual({
      kind: "name",
      value: "brand.primary",
    });
  });

  it("gives multiplication tighter binding than addition", () => {
    expect(parse("1 + 2 * 3")).toEqual({
      kind: "binary",
      op: "+",
      left: { kind: "number", value: 1 },
      right: {
        kind: "binary",
        op: "*",
        left: { kind: "number", value: 2 },
        right: { kind: "number", value: 3 },
      },
    });
  });

  it("parenthesises against precedence", () => {
    expect(parse("(1 + 2) * 3")).toMatchObject({ kind: "binary", op: "*" });
  });

  it("parses a ternary", () => {
    expect(parse("a == 0 ? 1 : 0.6")).toMatchObject({ kind: "ternary" });
  });

  it("parses unary minus", () => {
    expect(parse("-4")).toEqual({
      kind: "unary",
      op: "-",
      operand: { kind: "number", value: 4 },
    });
  });

  it("reports the position of an unexpected token so the popover can point at it", () => {
    const result = parse("1 + * 2");
    expect(result).toMatchObject({ error: expect.any(String), position: 4 });
  });

  it("rejects a trailing operator rather than silently succeeding", () => {
    expect(parse("1 +")).toMatchObject({ error: expect.any(String) });
  });
});

function scopeOf(
  vars: Record<string, string>,
  builtins: Record<string, string | number | boolean> = {},
): Scope {
  return {
    variable: (name) =>
      name in vars
        ? ({ name, kind: "number", expression: vars[name]! } as VariableDef)
        : undefined,
    builtin: (name) => builtins[name],
  };
}

const run = (source: string, scope: Scope) =>
  evaluate(parse(source) as never, scope);

describe("evaluate", () => {
  it("resolves a variable through its expression", () => {
    expect(run("brand.primary", scopeOf({ "brand.primary": "#151515" }))).toBe(
      "#151515",
    );
  });

  it("resolves a variable defined in terms of another", () => {
    expect(
      run("type.h2", scopeOf({ "type.h1": "48", "type.h2": "type.h1 * 0.75" })),
    ).toBe(36);
  });

  it("does not let a variable shadow a built-in", () => {
    const scope = scopeOf({ "slides.count": "99" }, { "slides.count": 3 });
    expect(run("slides.count", scope)).toBe(3);
  });

  it("reads a built-in when no variable shadows it", () => {
    expect(run("slides.index + 1", scopeOf({}, { "slides.index": 2 }))).toBe(3);
  });

  it("errors on a cycle instead of hanging the editor", () => {
    const scope = scopeOf({ a: "b", b: "a" });
    expect(run("a", scope)).toMatchObject({
      error: expect.stringContaining("Cycle"),
    });
  });

  it("errors on an unknown name so the row can show it", () => {
    expect(run("nope", scopeOf({}))).toMatchObject({
      error: expect.any(String),
    });
  });

  it("errors on division by zero rather than returning Infinity", () => {
    expect(run("1 / 0", scopeOf({}))).toMatchObject({
      error: expect.any(String),
    });
  });

  it("evaluates a ternary", () => {
    expect(
      run("slides.index == 0 ? 1 : 0.6", scopeOf({}, { "slides.index": 0 })),
    ).toBe(1);
  });

  it("concatenates when either side of + is a string", () => {
    expect(run("'Slide ' + 2", scopeOf({}))).toBe("Slide 2");
  });
});

describe("dependencies", () => {
  it("lists every name an expression reads, deduplicated", () => {
    expect(dependencies(parse("a + b * a") as never).sort()).toEqual([
      "a",
      "b",
    ]);
  });
});
