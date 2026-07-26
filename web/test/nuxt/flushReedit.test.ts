import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { useDeckSync } from "~/stores/useDeckSync";

// Hoisted fetch mock: each POST records its body and returns a promise we
// resolve manually, letting us keep a request "in-flight".
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

describe("BUG #2 — a same-key re-edit landing mid-flight survives the flush", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.calls.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the newer value pending and POSTs it on the next flush", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();

    const slidesId = "slide-1";
    const aId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const aPath = childPath(ROOT_PATH, aId);

    const rootNode = {
      id: "root-id",
      slides: slidesId,
      name: "root",
      path: ROOT_PATH,
      type: "core.group",
      reference: null,
      sort_order: 0,
    };
    const aNode = {
      id: aId,
      slides: slidesId,
      name: "v1",
      path: aPath,
      type: "core.group",
      reference: null,
      sort_order: 0,
    };

    const tree = buildTree([rootNode, aNode] as any);

    store.slides = [{ id: slidesId }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [tree];
    store.components = [[]] as any;

    // Enqueue node A (currently resolves to v1) and start a flush.
    sync.enqueueNode(aId);
    const firstFlush = sync.flush();

    // First POST is now in-flight with the v1 snapshot.
    expect(hoisted.calls.length).toBe(1);
    expect(hoisted.calls[0]!.body.nodesToUpsert[0].name).toBe("v1");

    // Mid-flight: edit A to v2 and re-enqueue it.
    tree.children[0]!.name = "v2";
    sync.enqueueNode(aId);

    // Now the in-flight request succeeds.
    hoisted.calls[0]!.resolve({});
    await firstFlush;

    // The v2 re-edit must still be pending (not clobbered by clearFlushed).
    expect(sync.hasPending).toBe(true);

    // A follow-up flush must POST the newer value.
    const secondFlush = sync.flush();
    expect(hoisted.calls.length).toBe(2);
    hoisted.calls[1]!.resolve({});
    await secondFlush;

    expect(hoisted.calls[1]!.body.nodesToUpsert[0].name).toBe("v2");
  });
});
