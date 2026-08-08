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

const SLIDE = "slide-1";
const ROOT_ID = "root-id";
const P1 = "11111111-1111-1111-1111-111111111111";
const P2 = "22222222-2222-2222-2222-222222222222";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const G = "99999999-9999-9999-9999-999999999999";
const X = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const C0 = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const C1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const Y = "ffffffff-ffff-ffff-ffff-ffffffffffff";

const mk = (id: string, path: string, order: number, type = "core.text") => ({
  id,
  slides: SLIDE,
  name: id,
  path,
  type,
  reference: null,
  sort_order: order,
});

const root = () => mk(ROOT_ID, ROOT_PATH, 0, "core.group");

const nodeType = (type: string, accepts: string[]) =>
  ({
    type,
    label: type,
    icon: "",
    accepts,
    defaultComponents: [],
    renderer: { element: "div", render: () => ({}) },
  }) as any;

// Flush and return the POSTed body (buildSavePayload runs synchronously).
async function flushAndGetBody(sync: ReturnType<typeof useDeckSync>) {
  const fp = sync.flush();
  if (hoisted.calls.length > 0) hoisted.calls[0]!.resolve({});
  await fp;
  return hoisted.calls[0]?.body;
}

const upserted = (body: any) =>
  Object.fromEntries((body?.nodesToUpsert ?? []).map((n: any) => [n.id, n]));

describe("group / ungroup sort_order recanonicalisation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    registerModule({
      id: "core",
      nodeTypes: [
        nodeType("core.group", ["core.group", "core.text", "webgl.canvas"]),
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

  it("groups cross-parent nodes with gap-free order, so buildTree can't break a tie by id", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const p1 = childPath(ROOT_PATH, P1);
    const p2 = childPath(ROOT_PATH, P2);
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          root(),
          mk(P1, p1, 0, "core.group"),
          mk(A, childPath(p1, A), 0),
          mk(P2, p2, 1, "core.group"),
          mk(B, childPath(p2, B), 0), // same rank as A, but under a different parent
        ] as any),
      ],
    ]);
    store.components = new Map([[SLIDE, []]]);
    store.selectedNodeIds = [A, B];

    store.groupSelection();

    // A new group was created, wrapping A and B, and became the selection.
    const groupId = store.selectedNodeIds[0]!;
    expect(groupId).not.toBe(A);
    const groupPath = childPath(ROOT_PATH, groupId);

    const sent = upserted(await flushAndGetBody(sync));
    // Document order (P1 before P2) → A precedes B → canonical 0,1, not a 0/0 tie.
    expect(sent[A].sort_order).toBe(0);
    expect(sent[B].sort_order).toBe(1);
    expect(sent[A].path).toBe(childPath(groupPath, A));
    expect(sent[B].path).toBe(childPath(groupPath, B));
  });

  it("ungroups children into the group's place with gap-free sibling order", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    const gPath = childPath(ROOT_PATH, G);
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          root(),
          mk(X, childPath(ROOT_PATH, X), 0),
          mk(G, gPath, 1, "core.group"),
          mk(C0, childPath(gPath, C0), 0),
          mk(C1, childPath(gPath, C1), 1),
          mk(Y, childPath(ROOT_PATH, Y), 2),
        ] as any),
      ],
    ]);
    store.components = new Map([[SLIDE, []]]);
    store.selectedNodeIds = [G];

    store.ungroupSelection();

    const sent = upserted(await flushAndGetBody(sync));
    // Children slot into G's place: X, c0, c1, Y → 0,1,2,3 (was colliding 0,0,1,2).
    expect(sent[X].sort_order).toBe(0);
    expect(sent[C0].sort_order).toBe(1);
    expect(sent[C1].sort_order).toBe(2);
    expect(sent[Y].sort_order).toBe(3);
    expect(sent[C0].path).toBe(childPath(ROOT_PATH, C0));
    expect(sent[C1].path).toBe(childPath(ROOT_PATH, C1));
  });

  // Root is a `core.group`, so it matches the plain type filter. Dissolving it
  // would enqueue a delete for path "root", which the server expands to
  // `path <@ 'root'` — every node on the slide.
  it("refuses to ungroup the root node", async () => {
    const store = useDeckStore();
    const sync = useDeckSync();
    store.slides = [{ id: SLIDE }] as any;
    store.currentSlidesIndex = 0;
    store.trees = new Map([
      [
        SLIDE,
        buildTree([
          root(),
          mk(X, childPath(ROOT_PATH, X), 0),
          mk(Y, childPath(ROOT_PATH, Y), 1),
        ] as any),
      ],
    ]);
    store.components = new Map([[SLIDE, []]]);
    store.selectedNodeIds = [ROOT_ID];

    store.ungroupSelection();

    const body = await flushAndGetBody(sync);
    expect(body?.nodesToDelete ?? []).toHaveLength(0);
    // The tree is untouched: root still anchors both children.
    const paths = store.currentFlat().map((n: any) => n.path);
    expect(paths).toContain(ROOT_PATH);
    expect(paths).toContain(childPath(ROOT_PATH, X));
    expect(paths).toContain(childPath(ROOT_PATH, Y));
  });
});
