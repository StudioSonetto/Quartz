import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { useDeckSync } from "~/stores/useDeckSync";

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

const SLIDE = "slide-1";
const ROOT_ID = "root-id";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const G = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const C = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const mk = (id: string, path: string, order: number, type = "group") => ({
  id,
  slides: SLIDE,
  name: id,
  path,
  type,
  reference: null,
  sort_order: order,
});

const root = () => mk(ROOT_ID, ROOT_PATH, 0);

// Flush and return the POSTed body (buildSavePayload runs synchronously).
async function flushAndGetBody(sync: ReturnType<typeof useDeckSync>) {
  const fp = sync.flush();
  if (hoisted.calls.length > 0) hoisted.calls[0]!.resolve({});
  await fp;
  return hoisted.calls[0]?.body;
}

describe("reorderNodes", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.calls.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reorders siblings under the same parent (sort_order only, paths unchanged)", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const aPath = childPath(ROOT_PATH, A);
    const bPath = childPath(ROOT_PATH, B);
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [buildTree([root(), mk(A, aPath, 0), mk(B, bPath, 1)] as any)];

    // Simulate the drag library swapping the two children in place.
    const r = store.trees[0]!;
    r.children = [r.children[1]!, r.children[0]!];

    store.reorderNodes();

    const body = await flushAndGetBody(sync);
    const sent = Object.fromEntries(
      (body.nodesToUpsert ?? []).map((n: any) => [n.id, n]),
    );
    expect(sent[B].sort_order).toBe(0);
    expect(sent[A].sort_order).toBe(1);
    expect(sent[A].path).toBe(aPath); // unchanged — same parent
    expect(sent[B].path).toBe(bPath);
  });

  it("re-parents a node into a group and rewrites its path", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const gPath = childPath(ROOT_PATH, G);
    const aPath = childPath(ROOT_PATH, A);
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [buildTree([root(), mk(G, gPath, 0), mk(A, aPath, 1)] as any)];

    // Simulate dragging A out of root and into G.
    const r = store.trees[0]!;
    const gTree = r.children.find((n) => n.id === G)!;
    const aTree = r.children.find((n) => n.id === A)!;
    r.children = r.children.filter((n) => n.id !== A);
    gTree.children.push(aTree);

    store.reorderNodes();

    const body = await flushAndGetBody(sync);
    const sent = Object.fromEntries(
      (body.nodesToUpsert ?? []).map((n: any) => [n.id, n]),
    );
    expect(sent[A].path).toBe(childPath(gPath, A));
    expect(sent[A].sort_order).toBe(0);
    // G's path did not change, so it is not re-sent.
    expect(sent[G]).toBeUndefined();
  });

  it("moves a subtree out to root, rewriting descendant paths", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const gPath = childPath(ROOT_PATH, G);
    const pPath = childPath(gPath, A); // A is a group nested under G
    const cPath = childPath(pPath, C); // C is A's child
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [
      buildTree([root(), mk(G, gPath, 0), mk(A, pPath, 0), mk(C, cPath, 0)] as any),
    ];

    // Simulate dragging A (with child C) out of G up to root level.
    const r = store.trees[0]!;
    const gTree = r.children.find((n) => n.id === G)!;
    const aTree = gTree.children.find((n) => n.id === A)!;
    gTree.children = gTree.children.filter((n) => n.id !== A);
    r.children.push(aTree);

    store.reorderNodes();

    const body = await flushAndGetBody(sync);
    const sent = Object.fromEntries(
      (body.nodesToUpsert ?? []).map((n: any) => [n.id, n]),
    );
    const newAPath = childPath(ROOT_PATH, A);
    expect(sent[A].path).toBe(newAPath);
    expect(sent[C].path).toBe(childPath(newAPath, C)); // descendant rewritten
  });

  it("no-ops when there is no current tree", () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = []; // no tree for the current slide

    expect(() => store.reorderNodes()).not.toThrow();
    expect(sync.hasPending).toBe(false);
  });

  it("enqueues nothing when the tree structure is unchanged", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const aPath = childPath(ROOT_PATH, A);
    const bPath = childPath(ROOT_PATH, B);
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [buildTree([root(), mk(A, aPath, 0), mk(B, bPath, 1)] as any)];

    // No drag happened — children order and paths are already canonical.
    store.reorderNodes();

    expect(sync.hasPending).toBe(false);
    // A subsequent flush has nothing to send.
    await flushAndGetBody(sync);
    expect(hoisted.calls.length).toBe(0);
  });
});
