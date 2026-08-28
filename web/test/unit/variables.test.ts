import { describe, expect, it } from "vitest";

const v = (name: string, expression: string): VariableDef => ({
  name,
  kind: "colour",
  expression,
});

describe("buildScope", () => {
  it("lets the nearest declaration shadow an ancestor's", () => {
    const scope = buildScope(
      [[v("brand.primary", "#c00")], [v("brand.primary", "#151515")]],
      {},
    );
    expect(scope.variable("brand.primary")?.expression).toBe("#c00");
  });

  it("falls through to an ancestor when the nearest does not declare it", () => {
    const scope = buildScope([[], [v("brand.primary", "#151515")]], {});
    expect(scope.variable("brand.primary")?.expression).toBe("#151515");
  });

  it("exposes built-ins", () => {
    expect(buildScope([], { "slides.count": 12 }).builtin("slides.count")).toBe(
      12,
    );
  });
});

describe("applyBindings", () => {
  const scope = buildScope([[v("brand.primary", "#151515")]], {});

  it("overwrites the raw value at a dotted path", () => {
    const out = applyBindings(
      { background: { type: "colour", value: "#FFF" } },
      { "background.value": "{{ brand.primary }}" },
      scope,
    );
    expect(out.background.value).toBe("#151515");
    expect(out.background.type).toBe("colour");
  });

  it("leaves the raw value in place when the binding fails", () => {
    const out = applyBindings(
      { colour: "#FFF" },
      { colour: "{{ missing }}" },
      scope,
    );
    expect(out.colour).toBe("#FFF");
  });

  it("does not mutate the stored data", () => {
    const data = { colour: "#FFF" };
    applyBindings(data, { colour: "{{ brand.primary }}" }, scope);
    expect(data.colour).toBe("#FFF");
  });
});

const num = (name: string, expression: string): VariableDef => ({
  name,
  kind: "number",
  expression,
});

describe("variableProblems", () => {
  it("flags a duplicate name on the later entry", () => {
    const problems = variableProblems([num("a", "1"), num("a", "2")]);
    expect(problems.get(1)).toContain("Duplicate");
    expect(problems.has(0)).toBe(false);
  });

  it("flags a self-referential expression", () => {
    expect(variableProblems([num("a", "{{ a + 1 }}")]).get(0)).toContain(
      "Cycle",
    );
  });

  it("flags a two-step cycle", () => {
    const problems = variableProblems([
      num("a", "{{ b }}"),
      num("b", "{{ a }}"),
    ]);
    expect(problems.get(0)).toContain("Cycle");
  });

  it("flags a parse error", () => {
    expect(variableProblems([num("a", "{{ 1 + }}")]).get(0)).toBeTruthy();
  });

  it("flags a name that a built-in already owns, which silently wins", () => {
    expect(variableProblems([num("slides.index", "1")]).get(0)).toContain(
      "built-in",
    );
  });

  it("flags a reference to a name nothing declares", () => {
    expect(variableProblems([num("a", "{{ nope * 2 }}")]).get(0)).toContain(
      "nope",
    );
  });

  it("accepts a reference to a name an ancestor declares", () => {
    expect(
      variableProblems([num("a", "{{ brand * 2 }}")], new Set(["brand"])).size,
    ).toBe(0);
  });

  it("accepts a reference to a built-in", () => {
    expect(variableProblems([num("a", "{{ slides.count - 1 }}")]).size).toBe(0);
  });

  it("passes a valid derived variable", () => {
    const problems = variableProblems([
      num("type.h1", "48"),
      num("type.h2", "{{ type.h1 * 0.75 }}"),
    ]);
    expect(problems.size).toBe(0);
  });

  it("ignores a blank row so a freshly added variable is not an error", () => {
    expect(variableProblems([num("", "")]).size).toBe(0);
  });

  it("flags a literal that does not match its kind", () => {
    expect(variableProblems([num("a", "Satoshi")]).get(0)).toContain(
      "Expected a number",
    );
  });

  it("flags an old bare reference, which now reads as text", () => {
    expect(variableProblems([v("a", "theme.primary")]).get(0)).toContain(
      "Expected a colour",
    );
  });

  it("accepts a literal that matches its kind", () => {
    expect(variableProblems([v("a", "#f5f5f5"), num("b", "24")]).size).toBe(0);
  });

  it("does not kind-check a value it cannot resolve without a scope", () => {
    expect(variableProblems([v("a", "{{ b }}"), v("b", "#f5f5f5")]).size).toBe(
      0,
    );
  });
});

describe("kindProblem", () => {
  it("accepts a hex string for a colour", () => {
    expect(kindProblem("#151515", "colour")).toBeNull();
  });

  it("rejects a number bound to a colour row", () => {
    expect(kindProblem(24, "colour")).toBeTruthy();
  });

  it("rejects a colour bound to a number row", () => {
    expect(kindProblem("#151515", "number")).toBeTruthy();
  });

  it("accepts any text for a string row", () => {
    expect(kindProblem("Slide 3", "string")).toBeNull();
  });

  it("accepts anything when the row declares no kind", () => {
    expect(kindProblem(24, undefined)).toBeNull();
  });
});

describe("renameInSource", () => {
  it("renames a bare reference", () => {
    expect(
      renameInSource("{{ brand.primary }}", "brand.primary", "brand.accent"),
    ).toBe("{{ brand.accent }}");
  });

  it("leaves a longer name that merely starts the same alone", () => {
    expect(
      renameInSource(
        "{{ brand.primaryDark + brand.primary }}",
        "brand.primary",
        "x",
      ),
    ).toBe("{{ (brand.primaryDark + x) }}");
  });

  it("renames inside every hole of a template", () => {
    expect(renameInSource("{{ a }} of {{ a }}", "a", "b")).toBe(
      "{{ b }} of {{ b }}",
    );
  });

  it("leaves a matching string literal alone", () => {
    expect(renameInSource("{{ 'a' + a }}", "a", "b")).toBe("{{ ('a' + b) }}");
  });

  it("returns the source unchanged when it does not parse", () => {
    expect(renameInSource("{{ 1 + }}", "a", "b")).toBe("{{ 1 + }}");
  });

  it("preserves precedence when reprinting", () => {
    expect(renameInSource("{{ 1 + 2 * 3 }}", "a", "b")).toBe(
      "{{ (1 + (2 * 3)) }}",
    );
  });

  it("leaves a literal alone even when it reads like a reference", () => {
    expect(renameInSource("brand.primary", "brand.primary", "x")).toBe(
      "brand.primary",
    );
  });
});

describe("usesVariable", () => {
  it("is true for a name inside a template hole", () => {
    expect(usesVariable("Slide {{ a + 1 }}", "a")).toBe(true);
  });

  it("is false for a name that only appears as literal text", () => {
    expect(usesVariable("a", "a")).toBe(false);
  });

  it("is false for a longer name that merely starts the same", () => {
    expect(usesVariable("{{ brand.primaryDark }}", "brand.primary")).toBe(
      false,
    );
  });
});
