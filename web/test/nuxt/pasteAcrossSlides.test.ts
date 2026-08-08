import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { registerModule, __resetRegistry } from "~/modules/registry";

const hoisted = vi.hoisted(() => {
  const calls: Array<{ url: string; body: any; resolve: (v: any) => void }> = [];
  const fetchMock = (url: string, opts: any) => {
    let resolve!: (v: any) => void;
    const promise = new Promise((res) => {
      resolve = res;
    });
    calls.push({ url, body: opts?.body, resolve });
    return promise;
  };
  return { calls, fetchMock };
});

mockNuxtImport("useRequestFetch", () => {
  return () => hoisted.fetchMock;
});

const SLIDE_A = "slide-a";
const SLIDE_B = "slide-b";
const ROOT_A = "root-a";
const ROOT_B = "root-b";
const N = "11111111-1111-1111-1111-111111111111";

const mk = (
  id: string,
  slides: string,
  path: string,
  order = 0,
  type = "core.text",
  reference: string | null = null,
) => ({ id, slides, name: id, path, type, reference, sort_order: order });

const nodeType = (type: string, accepts: string[]) =>
  ({
    type,
    label: type,
    icon: "",
    accepts,
    defaultComponents: [],
    renderer: { element: "div", render: () => ({}) },
  }) as any;

const transform = (node: string, x: number, y: number) => ({
  node,
  type: "core.transform",
  data: { position: { x, y } },
});

function seed() {
  const store = useDeckStore();
  store.slides = [{ id: SLIDE_A }, { id: SLIDE_B }] as any;
  store.currentSlidesIndex = 0;
  store.trees = new Map([
    [
      SLIDE_A,
      buildTree([
        mk(ROOT_A, SLIDE_A, ROOT_PATH, 0, "core.group"),
        mk(N, SLIDE_A, childPath(ROOT_PATH, N), 0, "core.text", "footer"),
      ] as any),
    ],
    [SLIDE_B, buildTree([mk(ROOT_B, SLIDE_B, ROOT_PATH, 0, "core.group")] as any)],
  ]);
  store.components = new Map([
    [SLIDE_A, [transform(N, 10, 20)]],
    [SLIDE_B, []],
  ]) as any;
  return store;
}

describe("paste across slides", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [
        nodeType("core.group", ["core.group", "core.text"]),
        nodeType("core.text", []),
      ],
      componentTypes: [],
    });
    hoisted.calls.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps position and reference when pasting onto a different slide", () => {
    const store = seed();
    store.selectedNodeIds = [N];
    store.copySelection();

    store.currentSlidesIndex = 1;
    store.selectedNodeIds = [ROOT_B];
    store.paste();

    const pasted = store.currentFlat().find((n: any) => n.id !== ROOT_B)!;
    expect(pasted.reference).toBe("footer");
    const comp = store.getComponent(pasted.id, "core.transform")!;
    expect(comp.data.position).toEqual({ x: 10, y: 20 });
  });

  it("steps a repeat paste off the copy already on that slide", () => {
    const store = seed();
    store.selectedNodeIds = [N];
    store.copySelection();

    store.currentSlidesIndex = 1;
    store.selectedNodeIds = [ROOT_B];
    store.paste();
    store.selectedNodeIds = [ROOT_B];
    store.paste();

    const pasted = store
      .currentFlat()
      .filter((n: any) => n.id !== ROOT_B)
      .map((n: any) => ({
        reference: n.reference,
        position: store.getComponent(n.id, "core.transform")!.data.position,
      }));

    expect(pasted).toHaveLength(2);
    // The first arrival links up at the source coordinates; the second can't
    // share either the spot or the key.
    expect(pasted).toContainEqual({
      reference: "footer",
      position: { x: 10, y: 20 },
    });
    expect(pasted).toContainEqual({
      reference: null,
      position: { x: 34, y: 44 },
    });
  });

  it("offsets and clears reference when pasting onto the source slide", () => {
    const store = seed();
    store.selectedNodeIds = [N];
    store.copySelection();
    store.selectedNodeIds = [ROOT_A];
    store.paste();

    const pasted = store.currentFlat().find(
      (n: any) => n.id !== ROOT_A && n.id !== N,
    )!;
    expect(pasted.reference).toBeNull();
    const comp = store.getComponent(pasted.id, "core.transform")!;
    expect(comp.data.position).toEqual({ x: 34, y: 44 });
  });

  it("clears reference on same-slide duplicate", () => {
    const store = seed();
    store.selectedNodeIds = [N];
    store.duplicateSelection();

    const dupe = store.currentFlat().find(
      (n: any) => n.id !== ROOT_A && n.id !== N,
    )!;
    expect(dupe.reference).toBeNull();
  });
});
