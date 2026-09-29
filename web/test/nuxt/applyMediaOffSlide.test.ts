import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { applyMediaAsset } from "~/modules/core/components/media/apply";

const hoisted = vi.hoisted(() => ({ fetchMock: () => new Promise(() => {}) }));

mockNuxtImport("useRequestFetch", () => () => hoisted.fetchMock);
mockNuxtImport("useAssetsStore", () => () => ({ mediaUrl: () => undefined }));

const SLIDE_A = "slide-a";
const SLIDE_B = "slide-b";
const MEDIA_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const root = (id: string, slides: string) => ({
  id,
  slides,
  name: "root",
  path: ROOT_PATH,
  type: "core.group",
  reference: null,
  sort_order: 0,
});

describe("applyMediaAsset", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [
        {
          type: "core.group",
          label: "g",
          icon: "",
          accepts: ["core.media"],
          defaultComponents: [],
          renderer: { element: "div", render: () => ({}) },
        },
        {
          type: "core.media",
          label: "m",
          icon: "",
          accepts: [],
          parents: ["core.group"],
          defaultComponents: [],
          renderer: { element: "div", render: () => ({}) },
        },
      ] as any,
      componentTypes: [],
    });
  });

  // An upload can outlast the user's stay on the slide the node was dropped on.
  it("sets the asset on a node whose slide is no longer shown", async () => {
    const store = useDeckStore();

    store.slides = [{ id: SLIDE_A }, { id: SLIDE_B }] as any;
    store.trees = new Map([
      [
        SLIDE_A,
        buildTree([
          root("root-a", SLIDE_A),
          {
            ...root(MEDIA_ID, SLIDE_A),
            name: "m",
            path: childPath(ROOT_PATH, MEDIA_ID),
            type: "core.media",
          },
        ] as any),
      ],
      [SLIDE_B, buildTree([root("root-b", SLIDE_B)] as any)],
    ]);
    store.components = new Map([
      [SLIDE_A, [{ node: MEDIA_ID, type: "core.media", data: { src: "" } }]],
      [SLIDE_B, []],
    ]) as any;
    store.currentSlidesIndex = 1;

    await applyMediaAsset([MEDIA_ID], "clip.mp4");

    expect(store.getComponent(MEDIA_ID, "core.media")?.data.src).toBe(
      "clip.mp4",
    );
  });
});
