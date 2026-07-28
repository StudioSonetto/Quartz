import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { useDeckSync } from "~/stores/useDeckSync";

// Shared, hoisted fetch mock: each call records the POST body and returns a
// promise we resolve manually so we can inspect exactly what was sent.
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

describe("BUG #1 — deleteSelectedNode purges descendants from outbox + components", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.calls.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not send a deleted child's component and removes it locally", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();

    const slidesId = "slide-1";
    const parentId = "11111111-1111-1111-1111-111111111111";
    const childId = "22222222-2222-2222-2222-222222222222";

    const parentPath = childPath(ROOT_PATH, parentId);
    const childPathStr = childPath(parentPath, childId);

    const rootNode = {
      id: "root-id",
      slides: slidesId,
      name: "root",
      path: ROOT_PATH,
      type: "core.group",
      reference: null,
      sort_order: 0,
    };
    const parentNode = {
      id: parentId,
      slides: slidesId,
      name: "parent",
      path: parentPath,
      type: "core.group",
      reference: null,
      sort_order: 0,
    };
    const childNode = {
      id: childId,
      slides: slidesId,
      name: "child",
      path: childPathStr,
      type: "core.group",
      reference: null,
      sort_order: 0,
    };

    const tree = buildTree([rootNode, parentNode, childNode] as any);

    store.slides = [{ id: slidesId }] as any;
    store.currentSlidesIndex = 0;
    store.trees = [tree];
    // The child's (dirty) component lives in the local component bag.
    store.components = [[{ id: "c-child", node: childId, type: "core.base", data: {} }]] as any;

    // Outbox has the child node + its component pending.
    sync.enqueueNode(childId);
    sync.enqueueComponent(childId, "core.base");

    // Select the PARENT and delete it (removes parent + child subtree).
    store.selectedNodeIds = [tree.children[0]!.id];
    store.deleteSelectedNode();

    // Flush and inspect what actually got POSTed.
    const fp = sync.flush();
    // buildSavePayload runs synchronously; if a POST happened, resolve it.
    if (hoisted.calls.length > 0) hoisted.calls[0]!.resolve({});
    await fp;

    const body = hoisted.calls[0]?.body;
    // The child's component must NOT be in the upsert payload.
    const sentChildComponent = (body?.componentsToUpsert ?? []).find(
      (c: any) => c.node === childId,
    );
    expect(sentChildComponent).toBeUndefined();

    // And it must be gone from local component state.
    const localChildComponent = (store.components[0] ?? []).find(
      (c: any) => c.node === childId,
    );
    expect(localChildComponent).toBeUndefined();
  });
});
