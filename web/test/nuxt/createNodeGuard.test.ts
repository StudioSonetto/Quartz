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
    creatable: true,
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
    store.trees = [
      buildTree([
        { id: "root-id", slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 },
      ] as any),
    ];
    store.components = [[]] as any;
  }

  it("creates a valid child under the root group", () => {
    const store = useDeckStore();
    seedRootOnly(store);
    store.selectedNode = null; // parent = root (group)
    expect(() => store.createNode("hello", "core.text")).not.toThrow();
    // The new text node is now in the tree.
    const names = store.trees[0]!.children.map((n) => n.name);
    expect(names).toContain("hello");
  });

  it("throws when the parent cannot contain the new type", () => {
    const store = useDeckStore();
    seedRootOnly(store);
    // Add a text node and select it as the (invalid) parent.
    const textPath = childPath(ROOT_PATH, TEXT_ID);
    store.trees = [
      buildTree([
        { id: "root-id", slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 },
        { id: TEXT_ID, slides: SLIDE, name: "t", path: textPath, type: "core.text", reference: null, sort_order: 0 },
      ] as any),
    ];
    store.selectedNode = store.trees[0]!.children[0]!; // the text node
    // Pin the message so an unrelated exception can't masquerade as a pass.
    expect(() => store.createNode("nope", "core.group")).toThrow(
      /cannot be placed inside/,
    );
  });
});
