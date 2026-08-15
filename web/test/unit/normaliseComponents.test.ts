import { beforeEach, describe, expect, it } from "vitest";
import {
  defineModule,
  registerModule,
  __resetRegistry,
} from "~/modules/registry";

function comp(node: string, type: string, data: any) {
  return { node, type, data } as any;
}
function node(id: string, type: string, path = id) {
  return {
    id,
    type,
    path,
    slides: "s",
    name: id,
    reference: null,
    sort_order: 0,
  } as any;
}

beforeEach(() => {
  __resetRegistry();
  registerModule(
    defineModule({
      id: "core",
      nodeTypes: [
        {
          type: "core.text",
          label: "Text",
          icon: "i",
          accepts: [],
          defaultComponents: ["core.base", "core.transform"],
          renderer: { element: "p", render: () => ({}) },
        },
        {
          type: "webgl.object",
          label: "3D Object",
          icon: "i",
          accepts: [],
          defaultComponents: ["core.base", "webgl.transform", "webgl.model"],
          renderer: { element: "", render: () => ({}) },
        },
        {
          type: "core.group",
          label: "Group",
          icon: "i",
          accepts: [],
          defaultComponents: ["core.base", "core.transform", "core.layout"],
          renderer: { element: "div", render: () => ({}) },
        },
        {
          type: "webgl.canvas",
          label: "3D Canvas",
          icon: "i",
          accepts: [],
          defaultComponents: [
            "core.base",
            {
              type: "core.transform",
              data: { size: { width: 640, height: 360 } },
            },
          ],
          renderer: { element: "div", render: () => ({}) },
        },
      ] as any,
      componentTypes: [
        {
          type: "core.base",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({}),
        },
        {
          type: "core.transform",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({
            position: { x: 0, y: 0, z: 0 },
            size: { width: "auto", height: "auto" },
            rotation: 0,
            scale: 1,
          }),
        },
        {
          type: "core.layout",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({
            mode: "free",
            background: { type: "none" },
            padding: 0,
            columns: 1,
            gap: 0,
            align: "start",
          }),
        },
        {
          type: "webgl.transform",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          }),
          migrate: (data: any) =>
            typeof data.scale === "number"
              ? {
                  ...data,
                  scale: { x: data.scale, y: data.scale, z: data.scale },
                }
              : data,
        },
        // The real one — it owns migrating the overrides its states hold.
        animation,
        {
          type: "webgl.model",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({
            type: "box",
            fallback: "none",
            colour: "#FAFAFA",
            texture: "default",
          }),
        },
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
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [comp("t1", "core.transform", { position: { x: 5 } })],
    );
    const t = components.find((c) => c.type === "core.transform")!;
    expect(t.data.position).toEqual({ x: 5, y: 0, z: 0 });
    expect(t.data.size).toEqual({ width: "auto", height: "auto" });
    expect(t.data.rotation).toBe(0);
  });

  it("synthesises a missing guaranteed component", () => {
    const components = normaliseComponents([node("t1", "core.text")], []);
    expect(components.some((c) => c.type === "core.base")).toBe(true);
    expect(components.some((c) => c.type === "core.transform")).toBe(true);
  });

  it("gives root exactly base + layout, and never a transform", () => {
    const components = normaliseComponents(
      [node("r", "core.group", "root")],
      [],
    );
    const types = components.map((c) => c.type).sort();
    expect(types).toEqual(["core.base", "core.layout"]);
    expect(components.some((c) => c.type === "core.transform")).toBe(false);
  });

  it("defaults root's background to the opaque slide base, not none", () => {
    const components = normaliseComponents(
      [node("r", "core.group", "root")],
      [],
    );
    const layout = components.find((c) => c.type === "core.layout")!;
    expect(layout.data.background).toEqual({
      type: "colour",
      value: "#FAFAFA",
    });
    // The rest of the layout defaults still apply.
    expect(layout.data.mode).toBe("free");
    expect(layout.data.columns).toBe(1);
  });

  it("defaults an ordinary group's background to none", () => {
    const components = normaliseComponents([node("g1", "core.group")], []);

    const layout = components.find((c) => c.type === "core.layout")!;
    expect(layout.data.background).toEqual({ type: "none" });
  });

  it("keeps root's stored background instead of clobbering it with the default", () => {
    const components = normaliseComponents(
      [node("r", "core.group", "root")],
      [
        comp("r", "core.layout", {
          background: { type: "image", value: "bg.png", fit: "tile" },
        }),
      ],
    );
    const layout = components.find((c) => c.type === "core.layout")!;
    expect(layout.data.background).toEqual({
      type: "image",
      value: "bg.png",
      fit: "tile",
    });
  });

  it("keeps a root component outside the fixed set, but never a transform", () => {
    const components = normaliseComponents(
      [node("r", "core.group", "root")],
      [
        comp("r", "core.animation", { duration: 5 }),
        comp("r", "core.transform", { position: { x: 9, y: 9, z: 0 } }),
      ],
    );
    const animation = components.find((c) => c.type === "core.animation")!;
    expect(animation.data.duration).toBe(5);
    expect(components.some((c) => c.type === "core.transform")).toBe(false);
  });

  // The merge alone cannot fix this: a stored number beats an object default.
  it("migrates stored data to the current shape before merging defaults", () => {
    const components = normaliseComponents(
      [node("o1", "webgl.object")],
      [comp("o1", "webgl.transform", { scale: 2 })],
    );
    const transform = components.find((c) => c.type === "webgl.transform")!;

    expect(transform.data.scale).toEqual({ x: 2, y: 2, z: 2 });
  });

  it("migrates animation state overrides, not just the component itself", () => {
    const components = normaliseComponents(
      [node("o1", "webgl.object")],
      [
        comp("o1", "core.animation", {
          states: {
            big: { overrides: { "webgl.transform": { scale: 3 } } },
          },
        }),
      ],
    );
    const animation = components.find((c) => c.type === "core.animation")!;

    expect(
      animation.data.states.big.overrides["webgl.transform"].scale,
    ).toEqual({ x: 3, y: 3, z: 3 });
  });
});
