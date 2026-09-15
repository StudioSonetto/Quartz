import { beforeEach, describe, expect, it } from "vitest";
import animation from "~/modules/core/components/animation";
import base from "~/modules/core/components/base";

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
        // The real one — it owns migrating the overrides its states hold.
        base,
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
          type: "core.event",
          icon: "i",
          inspector: {} as any,
          defaultData: () => ({ handlers: [] }),
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
        comp("r", "core.animation", {
          tracks: [
            {
              type: "core.layout",
              path: ["padding"],
              keys: [{ t: 5, value: 1 }],
            },
          ],
        }),
        comp("r", "core.transform", { position: { x: 9, y: 9, z: 0 } }),
      ],
    );
    const animation = components.find((c) => c.type === "core.animation")!;
    expect(animation.data.tracks).toHaveLength(1);
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

  it("moves states off core.animation and onto core.base, leaving the tracks behind", () => {
    const tracks = [
      {
        type: "core.transform",
        path: ["position", "x"],
        keys: [{ t: 0, value: 0 }],
      },
    ];
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.animation", {
          states: { hot: { overrides: {} } },
          tracks,
        }),
      ],
    );

    const animation = components.find((c) => c.type === "core.animation")!;
    const stored = components.find((c) => c.type === "core.base")!;

    expect(animation.data.states).toBeUndefined();
    expect(animation.data.tracks).toEqual(tracks);
    expect(Object.keys(stored.data.states)).toEqual(["hot"]);
  });

  it("migrates the overrides a moved state holds, not just the component itself", () => {
    const components = normaliseComponents(
      [node("o1", "webgl.object")],
      [
        comp("o1", "core.animation", {
          states: { big: { overrides: { "webgl.transform": { scale: 3 } } } },
        }),
      ],
    );
    const stored = components.find((c) => c.type === "core.base")!;

    expect(stored.data.states.big.overrides["webgl.transform"].scale).toEqual({
      x: 3,
      y: 3,
      z: 3,
    });
  });

  it("carries the node's old easing onto each moved state", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.animation", {
          easing: "linear",
          states: {
            hot: { overrides: {} },
            cold: { overrides: {}, easing: "ease-in" },
          },
        }),
      ],
    );
    const states = components.find((c) => c.type === "core.base")!.data.states;

    expect(states.hot.easing).toBe("linear");
    // A state that already carried its own easing keeps it.
    expect(states.cold.easing).toBe("ease-in");
  });

  it("carries a legacy node-level duration all the way to the handler", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.animation", {
          duration: 900,
          states: { hot: { overrides: {} } },
        }),
        comp("t1", "core.event", {
          handlers: [{ on: "click", action: "setState", state: "hot" }],
        }),
      ],
    );
    const handlers = components.find((c) => c.type === "core.event")!.data
      .handlers;
    const states = components.find((c) => c.type === "core.base")!.data.states;

    expect(handlers[0].duration).toBe(900);
    expect(states.hot.duration).toBeUndefined();
  });

  it("leaves an already-moved state alone, so repeated loads do not clobber edits", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: { hot: { overrides: {}, easing: "linear" } },
        }),
        comp("t1", "core.animation", {
          states: { hot: { overrides: {}, easing: "ease-in" } },
        }),
      ],
    );
    const states = components.find((c) => c.type === "core.base")!.data.states;

    expect(states.hot.easing).toBe("linear");
  });
  it("moves a state's duration onto the handlers that name it, and no others", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: { hot: { overrides: {}, duration: 900, easing: "linear" } },
        }),
        comp("t1", "core.event", {
          handlers: [
            { on: "click", action: "toggleState", state: "hot" },
            { on: "hover", action: "setState", state: "hot" },
            { on: "key", action: "setState", state: "cold" },
            { on: "click", action: "nextSlide" },
          ],
        }),
      ],
    );
    const handlers = components.find((c) => c.type === "core.event")!.data
      .handlers;

    expect(handlers[0].duration).toBe(900);
    expect(handlers[1].duration).toBe(900);
    expect(handlers[2].duration).toBeUndefined();
    expect(handlers[3].duration).toBeUndefined();
  });

  it("leaves a handler's own duration alone, so the two can diverge", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: { hot: { overrides: {}, duration: 900 } },
        }),
        comp("t1", "core.event", {
          handlers: [
            { on: "click", action: "setState", state: "hot", duration: 120 },
          ],
        }),
      ],
    );
    const handlers = components.find((c) => c.type === "core.event")!.data
      .handlers;

    expect(handlers[0].duration).toBe(120);
  });

  it("leaves the state with its overrides and easing only", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: {
            hot: {
              overrides: { "core.layout": { padding: 4 } },
              duration: 900,
              delay: 50,
              easing: "linear",
            },
          },
        }),
      ],
    );
    const hot = components.find((c) => c.type === "core.base")!.data.states.hot;

    expect(Object.keys(hot).sort()).toEqual(["easing", "overrides"]);
    expect(hot.easing).toBe("linear");
    expect(hot.overrides["core.layout"].padding).toBe(4);
  });

  it("drops the duration of a state no handler names, rather than throwing", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: { lonely: { overrides: {}, duration: 900 } },
        }),
      ],
    );
    const states = components.find((c) => c.type === "core.base")!.data.states;

    expect(states.lonely.duration).toBeUndefined();
    expect(states.lonely.overrides).toEqual({});
  });

  it("copies nothing on a second load, so a retimed handler survives", () => {
    const components = normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", { states: { hot: { overrides: {} } } }),
        comp("t1", "core.event", {
          handlers: [
            { on: "click", action: "setState", state: "hot", duration: 120 },
          ],
        }),
      ],
    );
    const handlers = components.find((c) => c.type === "core.event")!.data
      .handlers;

    expect(handlers[0].duration).toBe(120);
  });

  // Nothing else rewrites a migrated row, so anything not reported here is
  // lost on the next load.
  it("reports the rows a migration rewrote, so the caller can persist them", () => {
    const relocated: any[] = [];

    normaliseComponents(
      [node("t1", "core.text")],
      [
        comp("t1", "core.base", {
          states: { hot: { overrides: {}, duration: 900 } },
        }),
        comp("t1", "core.event", {
          handlers: [{ on: "click", action: "setState", state: "hot" }],
        }),
      ],
      relocated,
    );

    expect(relocated.map((c) => c.type).sort()).toEqual([
      "core.base",
      "core.event",
    ]);
  });

  it("reports both rows when states move off core.animation", () => {
    const relocated: any[] = [];

    normaliseComponents(
      [node("t1", "core.text")],
      [comp("t1", "core.animation", { states: { hot: { overrides: {} } } })],
      relocated,
    );

    expect(relocated.map((c) => c.type).sort()).toEqual([
      "core.animation",
      "core.base",
    ]);
  });

  it("reports nothing when there is nothing to migrate", () => {
    const relocated: any[] = [];

    normaliseComponents(
      [node("t1", "core.text")],
      [comp("t1", "core.base", { states: { hot: { overrides: {} } } })],
      relocated,
    );

    expect(relocated).toEqual([]);
  });
});
