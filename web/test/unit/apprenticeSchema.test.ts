import { describe, it, expect } from "vitest";

const defaults = {
  content: "Hello",
  size: 20,
  bold: false,
  colour: { r: 0, g: 0, b: 0 },
  tracks: [],
  extra: {},
};

describe("schemaOf", () => {
  it("describes scalars, objects and arrays", () => {
    expect(schemaOf(defaults)).toEqual({
      type: "object",
      properties: {
        content: { type: "string" },
        size: { type: "number" },
        bold: { type: "boolean" },
        colour: {
          type: "object",
          properties: {
            r: { type: "number" },
            g: { type: "number" },
            b: { type: "number" },
          },
        },
        tracks: { type: "array" },
        extra: { type: "object" },
      },
    });
  });
});

describe("checkPatch", () => {
  it("accepts a partial patch with the right types", () => {
    expect(checkPatch(defaults, { size: 48, colour: { r: 255 } })).toBeNull();
  });

  it("rejects a wrong type with the field path", () => {
    expect(checkPatch(defaults, { size: "big" })).toBe(
      "size must be a number, got string",
    );
  });

  it("rejects an unknown field", () => {
    expect(checkPatch(defaults, { sizee: 1 })).toBe("unknown field sizee");
  });

  it("checks nested fields", () => {
    expect(checkPatch(defaults, { colour: { r: "red" } })).toBe(
      "colour.r must be a number, got string",
    );
  });

  it("allows any keys inside an empty-object default and any items in arrays", () => {
    expect(checkPatch(defaults, { extra: { a: 1 }, tracks: [{ x: 1 }] })).toBeNull();
  });

  it("lets a union field (one with a type) change shape", () => {
    expect(checkPatch({ background: { type: "none" } }, { background: { type: "colour", value: "#111" } })).toBeNull();
  });

  it("takes a number or \"auto\" where a size can be either", () => {
    const size = { size: { width: "auto", height: "auto" } };

    expect(checkPatch(size, { size: { width: 800, height: "auto" } })).toBeNull();
    expect(checkPatch(size, { size: { width: true } })).toBe("size.width must be a string, got boolean");
    expect(checkPatch(defaults, { content: 5 })).toBe("content must be a string, got number");
    expect(checkPatch({ size: 48 }, { size: "auto" })).toBe("size must be a number, got string");
  });

  it("checks list entries against a sample entry", () => {
    const shape = { tracks: [{ path: ["x"], keys: [{ t: 0, value: null }] }] };

    expect(checkPatch(shape, { tracks: [{ path: ["x"], keys: [{ t: 0, value: "#fff" }] }] })).toBeNull();
    expect(checkPatch(shape, { tracks: [{ path: ["x"] }] })).toBe("tracks[0].keys is missing");
    expect(checkPatch(shape, { tracks: [{ path: ["x"], keys: [{ time: 0, value: 1 }] }] })).toBe("tracks[0].keys[0].t is missing");
  });

  it("rejects __proto__ and inherited names", () => {
    expect(checkPatch(defaults, JSON.parse('{"__proto__": {"polluted": true}}'))).toBe("unknown field __proto__");
    expect(checkPatch(defaults, { toString: "x" })).toBe("unknown field toString");
  });

  it("rejects a non-object patch", () => {
    expect(checkPatch(defaults, 5)).toBe("patch must be an object");
  });
});

describe("mergePatch", () => {
  it("merges objects deeply and replaces arrays, returning a new object", () => {
    const next = mergePatch(defaults, { colour: { r: 9 }, tracks: [1] });

    expect(next).not.toBe(defaults);
    expect(next.colour).toEqual({ r: 9, g: 0, b: 0 });
    expect(next.tracks).toEqual([1]);
    expect(defaults.colour.r).toBe(0);
  });

  it("never swaps the prototype", () => {
    const next = mergePatch(defaults, JSON.parse('{"__proto__": {"polluted": true}}'));

    expect(Object.getPrototypeOf(next)).toBe(Object.prototype);
    expect((next as any).polluted).toBeUndefined();
  });
});
