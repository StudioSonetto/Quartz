import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";

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
          {
            id: "root-id",
            slides: SLIDE,
            name: "root",
            path: ROOT_PATH,
            type: "core.group",
            reference: null,
            sort_order: 0,
          },
        ] as any),
      ],
    ]);
    store.components = new Map([[SLIDE, []]]);
  }

  function seedTextChild(store: ReturnType<typeof useDeckStore>) {
    seedRootOnly(store);

    const textPath = childPath(ROOT_PATH, TEXT_ID);
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          {
            id: "root-id",
            slides: SLIDE,
            name: "root",
            path: ROOT_PATH,
            type: "core.group",
            reference: null,
            sort_order: 0,
          },
          {
            id: TEXT_ID,
            slides: SLIDE,
            name: "t",
            path: textPath,
            type: "core.text",
            reference: null,
            sort_order: 0,
          },
        ] as any),
      ],
    ]);
  }

  it("throws when an explicit parent cannot contain the new type", () => {
    const store = useDeckStore();
    seedTextChild(store);
    expect(() =>
      store.createNode("nope", "core.group", { parentId: TEXT_ID }),
    ).toThrow(/cannot be placed inside/);
  });

  it("creates under the nearest accepting ancestor of the selection", () => {
    const store = useDeckStore();
    seedTextChild(store);

    const id = store.createNode("ok", "core.group");

    expect(id).toBeTruthy();
    expect(store.currentFlat().find((n) => n.id === id)?.path).toBe(
      childPath(ROOT_PATH, id!),
    );
  });
});
