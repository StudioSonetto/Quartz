import { describe, it, expect, beforeEach } from "vitest";

describe("assetKind", () => {
  it("classifies each supported extension", () => {
    expect(assetKind("logo.png")).toBe("image");
    expect(assetKind("photo.jpeg")).toBe("image");
    expect(assetKind("Satoshi.woff2")).toBe("font");
    expect(assetKind("chair.glb")).toBe("model");
    expect(assetKind("chair.fbx")).toBe("model");
  });

  it("ignores case, so an upper-case extension is not silently unsupported", () => {
    expect(assetKind("LOGO.PNG")).toBe("image");
  });

  it("returns undefined for anything else", () => {
    expect(assetKind("notes.txt")).toBeUndefined();
    expect(assetKind("png")).toBeUndefined();
  });
});

describe("uniqueAssetName", () => {
  it("keeps the name when nothing clashes", () => {
    expect(uniqueAssetName("logo.png", new Set())).toBe("logo.png");
  });

  it("suffixes before the extension, so the asset kind survives", () => {
    expect(uniqueAssetName("logo.png", new Set(["logo.png"]))).toBe(
      "logo-1.png",
    );
  });

  it("counts past every taken suffix", () => {
    expect(
      uniqueAssetName("logo.png", new Set(["logo.png", "logo-1.png"])),
    ).toBe("logo-2.png");
  });

  it("appends when there is no extension to split on", () => {
    expect(uniqueAssetName("logo", new Set(["logo"]))).toBe("logo-1");
    expect(uniqueAssetName(".env", new Set([".env"]))).toBe(".env-1");
  });
});

// Stand-ins for the real types. The webgl ones cannot be imported — that layer
// is a separate private repo — so the boundary is modelled, not borrowed.
const nodeType = (type: string, extra: Record<string, any> = {}) =>
  ({
    type,
    label: type,
    icon: "",
    accepts: [],
    defaultComponents: [],
    renderer: { element: "div", render: () => ({}) },
    ...extra,
  }) as any;

function registerTypes() {
  __resetRegistry();
  registerModule({
    id: "core",
    nodeTypes: [
      nodeType("core.group", { accepts: ["core.group", "core.text"] }),
      nodeType("core.text", { defaultComponents: ["core.transform"] }),
      nodeType("core.image", {
        parents: ["core.group"],
        defaultComponents: [
          {
            type: "core.transform",
            data: { size: { width: 480, height: 270 } },
          },
        ],
        asset: { kind: "image", apply: () => {} },
      }),
    ],
    componentTypes: [
      {
        type: "core.transform",
        icon: "",
        inspector: {} as any,
        defaultData: () => ({
          position: { x: 0, y: 0, z: 0 },
          size: { width: "auto", height: "auto" },
          rotation: 0,
          scale: 1,
        }),
      } as any,
    ],
  });
  registerModule({
    id: "webgl",
    nodeTypes: [
      nodeType("webgl.canvas", {
        accepts: ["webgl.object"],
        parents: ["core.group"],
        defaultComponents: [
          {
            type: "core.transform",
            data: { size: { width: 640, height: 360 } },
          },
        ],
        asset: { kind: "model", apply: () => {} },
      }),
      nodeType("webgl.object", {
        parents: ["webgl.canvas"],
        asset: { kind: "model", apply: () => {} },
      }),
    ],
    componentTypes: [],
  });
}

describe("resolveAssetDrop", () => {
  beforeEach(registerTypes);

  it("gives an image node for an image dropped on a group", () => {
    expect(resolveAssetDrop("image", "core.group" as any)?.type).toBe(
      "core.image",
    );
  });

  // The whole canvas-or-object question is answered by containment alone.
  it("gives a canvas for a model dropped on a group", () => {
    expect(resolveAssetDrop("model", "core.group" as any)?.type).toBe(
      "webgl.canvas",
    );
  });

  it("gives an object for a model dropped on a canvas", () => {
    expect(resolveAssetDrop("model", "webgl.canvas" as any)?.type).toBe(
      "webgl.object",
    );
  });

  it("gives nothing for a kind no type consumes", () => {
    expect(resolveAssetDrop("font", "core.group" as any)).toBeUndefined();
  });

  // With the layer detached, models must degrade to nothing, not to an image.
  it("gives nothing for a model when no module is registered", () => {
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [
        nodeType("core.group", { accepts: ["core.text"] }),
        nodeType("core.image", {
          parents: ["core.group"],
          asset: { kind: "image", apply: () => {} },
        }),
      ],
      componentTypes: [],
    });
    expect(resolveAssetDrop("model", "core.group" as any)).toBeUndefined();
  });
});

describe("resolveDropTarget", () => {
  beforeEach(registerTypes);

  const group = { id: "g", type: "core.group" } as any;
  const text = { id: "t", type: "core.text", parent: group } as any;

  it("walks up to an ancestor that can hold the asset", () => {
    const hit = resolveDropTarget(text, "image");
    expect(hit?.parent.id).toBe("g");
    expect(hit?.def.type).toBe("core.image");
  });

  it("stops at the node itself when it already qualifies", () => {
    expect(resolveDropTarget(group, "image")?.parent.id).toBe("g");
  });

  it("returns null when no ancestor qualifies", () => {
    expect(resolveDropTarget(text, "font")).toBeNull();
    expect(resolveDropTarget(null, "image")).toBeNull();
  });
});

describe("defaultNodeSize", () => {
  beforeEach(registerTypes);

  it("reads the node type's own transform override", () => {
    expect(defaultNodeSize("core.image" as any)).toEqual({
      width: 480,
      height: 270,
    });
    expect(defaultNodeSize("webgl.canvas" as any)).toEqual({
      width: 640,
      height: 360,
    });
  });

  // A phantom box here would centre a 3D object on a 2D point that means
  // nothing inside a scene.
  it("returns null for a type with no core.transform", () => {
    expect(defaultNodeSize("webgl.object" as any)).toBeNull();
  });

  it("returns null for an auto size, which cannot be centred", () => {
    expect(defaultNodeSize("core.text" as any)).toBeNull();
  });
});

describe("dropPosition", () => {
  const rect = { left: 100, top: 50, width: 960, height: 540 };
  const canvas = { width: 1920, height: 1080 };

  it("centres the node on the cursor in canvas units", () => {
    // Cursor at the middle of the render → 960,540 in canvas units.
    const pos = dropPosition({ x: 580, y: 320 }, rect, canvas, {
      width: 480,
      height: 270,
    });
    expect(pos).toEqual({ x: 720, y: 405 });
  });

  it("does not centre when the type has no size", () => {
    const pos = dropPosition({ x: 580, y: 320 }, rect, canvas, null);
    expect(pos).toEqual({ x: 960, y: 540 });
  });

  it("clamps so the node lands fully on the slide", () => {
    const topLeft = dropPosition({ x: 100, y: 50 }, rect, canvas, {
      width: 480,
      height: 270,
    });
    expect(topLeft).toEqual({ x: 0, y: 0 });

    const bottomRight = dropPosition({ x: 1060, y: 590 }, rect, canvas, {
      width: 480,
      height: 270,
    });
    expect(bottomRight).toEqual({ x: 1440, y: 810 });
  });

  it("clamps to zero when the node is larger than the slide", () => {
    const pos = dropPosition({ x: 580, y: 320 }, rect, canvas, {
      width: 4000,
      height: 4000,
    });
    expect(pos).toEqual({ x: 0, y: 0 });
  });
});
