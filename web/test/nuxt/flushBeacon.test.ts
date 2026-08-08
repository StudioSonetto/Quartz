import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { buildTree } from "~/utils/tree";
import { childPath, ROOT_PATH } from "~/utils/nodePath";
import { useDeckStore } from "~/stores/useDeckStore";
import { useDeckSync } from "~/stores/useDeckSync";

// flushBeacon never touches apiFetch, but the sync store resolves it at init.
mockNuxtImport("useRequestFetch", () => {
  return () => () => new Promise(() => {});
});

const SLIDE = "slide-1";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const seedTreeWithA = (store: ReturnType<typeof useDeckStore>) => {
  const aPath = childPath(ROOT_PATH, A);
  store.slides = [{ id: SLIDE }] as any;
  store.currentSlidesIndex = 0;
  store.trees = new Map([
    [
      SLIDE,
      buildTree([
        { id: "root-id", slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 },
        { id: A, slides: SLIDE, name: "a", path: aPath, type: "core.group", reference: null, sort_order: 0 },
      ] as any),
    ],
  ]);
};

describe("flushBeacon (page-unload flush)", () => {
  let beacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: beacon,
      configurable: true,
      writable: true,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the pending payload via sendBeacon to the save endpoint", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    seedTreeWithA(store);

    sync.enqueueNode(A); // still inside the debounce window
    sync.flushBeacon();

    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, blob] = beacon.mock.calls[0]!;
    expect(url).toBe("/api/nodes/save");
    const payload = JSON.parse(await (blob as Blob).text());
    expect(payload.nodesToUpsert.map((n: any) => n.id)).toContain(A);
  });

  it("does nothing when there is nothing pending", () => {
    const sync = useDeckSync();
    sync.flushBeacon();
    expect(beacon).not.toHaveBeenCalled();
  });
});
