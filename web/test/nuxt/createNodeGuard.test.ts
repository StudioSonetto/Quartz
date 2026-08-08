import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { registerModule, __resetRegistry } from "~/modules/registry";

const hoisted = vi.hoisted(() => {
  const fetchMock = () => new Promise(() => {});
  return { fetchMock };
});
mockNuxtImport("useRequestFetch", () => {
  return () => hoisted.fetchMock;
});

const node = (type: string, accepts: string[]) =>
  ({
    type,
    label: type,
    icon: "",
    accepts,
    defaultComponents: [],
    renderer: { element: "div", render: () => ({}) },
  }) as any;

const SLIDE = "slide-1";
const TEXT_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

describe("createNode containment guard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [
        node("core.group", ["core.group", "core.text", "webgl.canvas"]),
        node("core.text", []),
        node("webgl.canvas", ["webgl.object"]),
        node("webgl.object", []),
      ],
      componentTypes: [],
    });
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function seedRootOnly(store: ReturnType<typeof useDeckStore>) {
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          { id: "root-id", slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 },
        ] as any),
      ],
    ]);
    store.components = new Map([[SLIDE, []]]);
  }

  // A guard that stops throwing looks identical to one that works, and the
  // webgl.* fixtures cannot be exercised without the private layer attached.
  it("throws when the parent cannot contain the new type", () => {
    const store = useDeckStore();
    seedRootOnly(store);
    // Add a text node and select it as the (invalid) parent.
    const textPath = childPath(ROOT_PATH, TEXT_ID);
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          { id: "root-id", slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 },
          { id: TEXT_ID, slides: SLIDE, name: "t", path: textPath, type: "core.text", reference: null, sort_order: 0 },
        ] as any),
      ],
    ]);
    store.selectedNodeIds = [store.trees.get(SLIDE)!.children[0]!.id]; // the text node
    // Pin the message so an unrelated exception can't masquerade as a pass.
    expect(() => store.createNode("nope", "core.group")).toThrow(
      /cannot be placed inside/,
    );
  });
});
