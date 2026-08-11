import { describe, expect, it } from "vitest";
import { applyBindings, buildScope, resolveBinding } from "~/utils/variables";
import type { VariableDef } from "~/utils/expression";

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

describe("resolveBinding", () => {
  const scope = buildScope([[v("brand.primary", "#151515")]], {
    "slides.index": 2,
    "slides.count": 12,
  });

  it("evaluates a bare expression", () => {
    expect(resolveBinding("brand.primary", scope)).toEqual({
      ok: true,
      value: "#151515",
    });
  });

  it("treats a source containing {{ as a template", () => {
    expect(
      resolveBinding(
        "Slide {{ slides.index + 1 }} of {{ slides.count }}",
        scope,
      ),
    ).toEqual({ ok: true, value: "Slide 3 of 12" });
  });

  it("keeps literal text outside the holes", () => {
    expect(resolveBinding("v{{ slides.count }}", scope)).toEqual({
      ok: true,
      value: "v12",
    });
  });

  it("fails on an unclosed hole rather than rendering the braces", () => {
    expect(resolveBinding("Slide {{ slides.index", scope)).toMatchObject({
      ok: false,
    });
  });

  it("reports a parse error", () => {
    expect(resolveBinding("1 +", scope)).toMatchObject({ ok: false });
  });
});

describe("applyBindings", () => {
  const scope = buildScope([[v("brand.primary", "#151515")]], {});

  it("overwrites the raw value at a dotted path", () => {
    const out = applyBindings(
      { background: { type: "colour", value: "#FFF" } },
      { "background.value": "brand.primary" },
      scope,
    );
    expect(out.background.value).toBe("#151515");
    expect(out.background.type).toBe("colour");
  });

  it("leaves the raw value in place when the binding fails", () => {
    const out = applyBindings({ colour: "#FFF" }, { colour: "missing" }, scope);
    expect(out.colour).toBe("#FFF");
  });

  it("does not mutate the stored data", () => {
    const data = { colour: "#FFF" };
    applyBindings(data, { colour: "brand.primary" }, scope);
    expect(data.colour).toBe("#FFF");
  });
});
