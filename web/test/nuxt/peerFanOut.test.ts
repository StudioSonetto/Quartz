import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { useDeckSync } from "~/stores/useDeckSync";
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
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const LONE = "33333333-3333-3333-3333-333333333333";
const A2 = "44444444-4444-4444-4444-444444444444";

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

async function flushAndGetBody(sync: ReturnType<typeof useDeckSync>) {
  const fp = sync.flush();
  if (hoisted.calls.length > 0) hoisted.calls[0]!.resolve({});
  await fp;
  return hoisted.calls[0]?.body;
}

// A on slide 0 and B on slide 1 share the key "footer"; LONE has no key.
function seed() {
  const store = useDeckStore();
  store.slides = [{ id: SLIDE_A }, { id: SLIDE_B }] as any;
  store.currentSlidesIndex = 0;
  store.trees = new Map([
    [
      SLIDE_A,
      buildTree([
        mk(ROOT_A, SLIDE_A, ROOT_PATH, 0, "core.group"),
        mk(A, SLIDE_A, childPath(ROOT_PATH, A), 0, "core.text", "footer"),
        mk(LONE, SLIDE_A, childPath(ROOT_PATH, LONE), 1, "core.text", null),
      ] as any),
    ],
    [
      SLIDE_B,
      buildTree([
        mk(ROOT_B, SLIDE_B, ROOT_PATH, 0, "core.group"),
        mk(B, SLIDE_B, childPath(ROOT_PATH, B), 0, "core.text", "footer"),
      ] as any),
    ],
  ]);
  store.components = new Map([
    [SLIDE_A, [transform(A, 10, 20), transform(LONE, 0, 0)]],
    [SLIDE_B, [transform(B, 10, 20)]],
  ]) as any;
  return store;
}

describe("peer fan-out", () => {
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

  it("finds peers across slides and ignores unkeyed nodes", () => {
    const store = seed();
    expect(store.peersOf(A).map((p) => p.node.id)).toEqual([B]);
    expect(store.peersOf(A)[0]!.slideIndex).toBe(1);
    expect(store.peersOf(LONE)).toEqual([]);
  });

  // Decks predating the feature hold keys repeated within one slide, because
  // the old reference field wrote one key across a whole multi-selection.
  it("ignores a node sharing the key on the source's own slide", () => {
    const store = seed();
    store.trees.set(
      SLIDE_A,
      buildTree([
        mk(ROOT_A, SLIDE_A, ROOT_PATH, 0, "core.group"),
        mk(A, SLIDE_A, childPath(ROOT_PATH, A), 0, "core.text", "footer"),
        mk(A2, SLIDE_A, childPath(ROOT_PATH, A2), 1, "core.text", "footer"),
      ] as any),
    );
    store.components.get(SLIDE_A)!.push(transform(A2, 0, 0) as any);

    expect(store.peersOf(A).map((p) => p.node.id)).toEqual([B]);

    store.updateComponent(transform(A, 99, 99) as any);
    expect(store.getComponent(A2, "core.transform")!.data.position).toEqual({
      x: 0,
      y: 0,
    });

    store.updateNode(A, { name: "Footer" });
    expect(store.getNodeById(A2)!.name).toBe(A2);
  });

  it("mirrors a component write onto the peer's slide and enqueues both", async () => {
    const store = seed();
    const sync = useDeckSync();

    store.updateComponent(transform(A, 99, 99) as any);

    expect(store.getComponent(B, "core.transform")!.data.position).toEqual({
      x: 99,
      y: 99,
    });
    const body = await flushAndGetBody(sync);
    const sent = (body?.componentsToUpsert ?? []).map((c: any) => c.node);
    expect(sent).toContain(A);
    expect(sent).toContain(B);
  });

  it("gives each peer its own data object", () => {
    const store = seed();
    store.updateComponent(transform(A, 99, 99) as any);

    const a = store.getComponent(A, "core.transform")!;
    const b = store.getComponent(B, "core.transform")!;
    expect(b.data).not.toBe(a.data);
    a.data.position.x = 1;
    expect(b.data.position.x).toBe(99);
  });

  it("writes a component into the slide that owns the node, not the current one", () => {
    const store = seed();
    store.currentSlidesIndex = 0;
    // B is on slide 1 while slide 0 is current, as the adopt path does.
    store.updateComponent(transform(B, 7, 7) as any);

    expect(
      store.components.get(SLIDE_B)!.filter((c: any) => c.node === B),
    ).toHaveLength(1);
    expect(
      store.components.get(SLIDE_A)!.some((c: any) => c.node === B),
    ).toBe(false);
  });

  it("mirrors name but never mirrors the key itself", () => {
    const store = seed();
    store.updateNode(A, { name: "Footer" });
    expect(store.getNodeById(B)!.name).toBe("Footer");

    store.updateNode(A, { reference: "header" });
    expect(store.getNodeById(B)!.reference).toBe("footer");
  });
});
