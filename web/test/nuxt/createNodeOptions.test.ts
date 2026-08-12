import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";

const hoisted = vi.hoisted(() => {
  const fetchMock = () => new Promise(() => {});
  return { fetchMock };
});
mockNuxtImport("useRequestFetch", () => {
  return () => hoisted.fetchMock;
});

const SLIDE = "slide-1";
const ROOT_ID = "root-id";
const GROUP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const onCreate = vi.fn();

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

function seed(store: ReturnType<typeof useDeckStore>) {
  store.slides = [{ id: SLIDE }] as any;
  store.currentSlidesIndex = 0;
  store.trees = new Map([
    [
      SLIDE,
      buildTree([
        {
          id: ROOT_ID,
          slides: SLIDE,
          name: "root",
          path: ROOT_PATH,
          type: "core.group",
          reference: null,
          sort_order: 0,
        },
        {
          id: GROUP_ID,
          slides: SLIDE,
          name: "g",
          path: childPath(ROOT_PATH, GROUP_ID),
          type: "core.group",
          reference: null,
          sort_order: 0,
        },
      ] as any),
    ],
  ]);
  store.components = new Map([[SLIDE, []]]);
}

describe("createNode options", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    onCreate.mockClear();
    registerModule({
      id: "core",
      nodeTypes: [
        nodeType("core.group", { accepts: ["core.group", "core.image"] }),
        nodeType("core.image", {
          parents: ["core.group"],
          defaultComponents: ["core.transform"],
          onCreate,
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
  });

  it("parents to parentId instead of the selection", () => {
    const store = useDeckStore();
    seed(store);
    store.selectedNodeIds = [ROOT_ID];

    const id = store.createNode("i", "core.image", { parentId: GROUP_ID });

    expect(id).toBeTruthy();
    expect(store.getNodeAsTree(id!)?.parent?.id).toBe(GROUP_ID);
  });

  // A peer can delete the drop target mid-drag; falling back to the selection
  // would put the node somewhere the caller never asked for.
  it("bails when an explicit parentId no longer exists", () => {
    const store = useDeckStore();
    seed(store);
    store.selectedNodeIds = [ROOT_ID];

    const before = store.currentFlat().length;

    expect(
      store.createNode("i", "core.image", { parentId: "gone" }),
    ).toBeUndefined();
    expect(store.currentFlat()).toHaveLength(before);
  });

  it("writes the position into the new transform", () => {
    const store = useDeckStore();
    seed(store);

    const id = store.createNode("i", "core.image", {
      position: { x: 40, y: 90 },
    });

    const transform = store.getComponent(id!, "core.transform");
    expect(transform?.data.position).toEqual({ x: 40, y: 90, z: 0 });
  });

  // onCreate seeds a node with the FIRST asset in the deck and resizes to fit
  // asynchronously. Left to run alongside a dropped asset it would race it.
  it("skips onCreate when seeded", () => {
    const store = useDeckStore();
    seed(store);

    // Both pinned to root: creating a node selects it, so without parentId the
    // second call would parent into the first image and throw.
    store.createNode("i", "core.image", { parentId: ROOT_ID });
    expect(onCreate).toHaveBeenCalledTimes(1);

    store.createNode("i", "core.image", { parentId: ROOT_ID, seed: true });
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
