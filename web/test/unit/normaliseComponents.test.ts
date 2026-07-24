import { beforeEach, describe, expect, it } from "vitest";
import { defineModule, registerModule, __resetRegistry } from "~/modules/registry";
import { deepMerge, effectiveDefaults, normaliseComponents } from "~/utils/normaliseComponents";

function comp(node: string, type: string, data: any) {
  return { node, type, data } as any;
}
function node(id: string, type: string, path = id) {
  return { id, type, path, slides: "s", name: id, reference: null, sort_order: 0 } as any;
}

beforeEach(() => {
  __resetRegistry();
  registerModule(
    defineModule({
      id: "core",
      nodeTypes: [
        {
          type: "core.text", label: "Text", icon: "i",
          accepts: [], defaultComponents: ["core.base", "core.transform"],
          renderer: { element: "p", render: () => ({}) },
        },
        {
          type: "webgl.object", label: "3D Object", icon: "i",
          accepts: [], defaultComponents: ["core.base", "webgl.transform", "webgl.model"],
          renderer: { element: "", render: () => ({}) },
        },
        {
          type: "webgl.canvas", label: "3D Canvas", icon: "i",
          accepts: [], defaultComponents: [
            "core.base",
            { type: "core.transform", data: { size: { width: 640, height: 360 } } },
          ],
          renderer: { element: "div", render: () => ({}) },
        },
      ] as any,
      componentTypes: [
        { type: "core.base", icon: "i", inspector: {} as any, defaultData: () => ({}) },
        { type: "core.transform", icon: "i", inspector: {} as any,
          defaultData: () => ({ position: { x: 0, y: 0, z: 0 }, size: { width: "auto", height: "auto" }, rotation: 0, scale: 1 }) },
        { type: "webgl.transform", icon: "i", inspector: {} as any,
          defaultData: () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1 }) },
        { type: "webgl.model", icon: "i", inspector: {} as any,
          defaultData: () => ({ type: "box", fallback: "none", colour: "#FAFAFA", texture: "default" }) },
      ] as any,
    }),
  );
});

describe("deepMerge", () => {
  it("fills missing keys and lets override win", () => {
    const r = deepMerge({ a: 1, n: { x: 0, y: 0 } }, { n: { y: 9 } });
    expect(r).toEqual({ a: 1, n: { x: 0, y: 9 } });
  });
});

describe("effectiveDefaults", () => {
  it("applies a node-type override over the component default", () => {
    const d = effectiveDefaults("webgl.canvas", "core.transform");
    expect(d.size).toEqual({ width: 640, height: 360 });
    expect(d.position).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("normaliseComponents", () => {
  it("fills missing default fields on a stored component", () => {
    const { components, enqueue } = normaliseComponents(
      [node("t1", "core.text")],
      [comp("t1", "core.transform", { position: { x: 5 } })],
    );
    const t = components.find((c) => c.type === "core.transform")!;
    expect(t.data.position).toEqual({ x: 5, y: 0, z: 0 });
    expect(t.data.size).toEqual({ width: "auto", height: "auto" });
    expect(t.data.rotation).toBe(0);
    // The generic fill pass must never enqueue (avoids a load-time write storm).
    expect(enqueue).toHaveLength(0);
  });

  it("synthesises a missing guaranteed component", () => {
    const { components, enqueue } = normaliseComponents([node("t1", "core.text")], []);
    expect(components.some((c) => c.type === "core.base")).toBe(true);
    expect(components.some((c) => c.type === "core.transform")).toBe(true);
    // Add-missing is in-memory only — no enqueue on the generic pass.
    expect(enqueue).toHaveLength(0);
  });

  it("never adds components to the root node", () => {
    const { components } = normaliseComponents(
      [node("r", "core.group", "root")],
      [],
    );
    expect(components).toHaveLength(0);
  });

  it("migrates a legacy webgl.object (model.x/y/z -> webgl.transform, drops core.transform)", () => {
    const { components, enqueue } = normaliseComponents(
      [node("o1", "webgl.object")],
      [
        comp("o1", "webgl.model", { type: "box", x: 10, y: 20, z: 30, scale: 2, colour: "#fff", texture: "default" }),
        comp("o1", "core.transform", { position: { x: 0, y: 0, z: 0 } }),
      ],
    );
    const wt = components.find((c) => c.type === "webgl.transform")!;
    expect(wt.data.position).toEqual({ x: 10, y: 20, z: 30 });
    expect(wt.data.scale).toBe(2);
    const model = components.find((c) => c.type === "webgl.model")!;
    expect(model.data.x).toBeUndefined();
    expect(components.some((c) => c.type === "core.transform")).toBe(false);
    expect(enqueue).toEqual(
      expect.arrayContaining([
        { node: "o1", type: "webgl.transform" },
        { node: "o1", type: "webgl.model" },
      ]),
    );
  });

  it("is idempotent — already-migrated webgl.object enqueues nothing", () => {
    const { enqueue } = normaliseComponents(
      [node("o1", "webgl.object")],
      [
        comp("o1", "webgl.model", { type: "box", colour: "#fff", texture: "default" }),
        comp("o1", "webgl.transform", { position: { x: 10, y: 20, z: 30 }, rotation: { x: 0, y: 0, z: 0 }, scale: 2 }),
      ],
    );
    expect(enqueue).toHaveLength(0);
  });
});
