import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";

const hoisted = vi.hoisted(() => {
  const calls: Array<{ url: string; body: any; resolve: (v: any) => void }> =
    [];
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
const TEXT_ID = "11111111-1111-1111-1111-111111111111";
const PEER_ID = "22222222-2222-2222-2222-222222222222";

const mk = (
  id: string,
  slides: string,
  path: string,
  order = 0,
  type = "core.text",
  reference: string | null = null,
) => ({
  id,
  slides,
  name: id,
  path,
  type,
  reference,
  sort_order: order,
  unsynced: null,
  locked: false,
});

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

function seedOneSlide(deck: ReturnType<typeof useDeckStore>) {
  deck.slides = [{ id: SLIDE_A }] as any;
  deck.currentSlidesIndex = 0;
  deck.trees.set(
    SLIDE_A,
    buildTree([
      mk(ROOT_A, SLIDE_A, ROOT_PATH, 0, "core.group"),
      mk(TEXT_ID, SLIDE_A, childPath(ROOT_PATH, TEXT_ID)),
    ] as any),
  );
  deck.components.set(SLIDE_A, [transform(TEXT_ID, 10, 10) as any]);
}

function seedKeyedPeers(deck: ReturnType<typeof useDeckStore>) {
  deck.slides = [{ id: SLIDE_A }, { id: SLIDE_B }] as any;
  deck.currentSlidesIndex = 0;
  deck.trees.set(
    SLIDE_A,
    buildTree([
      mk(ROOT_A, SLIDE_A, ROOT_PATH, 0, "core.group"),
      mk(
        TEXT_ID,
        SLIDE_A,
        childPath(ROOT_PATH, TEXT_ID),
        0,
        "core.text",
        "footer",
      ),
    ] as any),
  );
  deck.trees.set(
    SLIDE_B,
    buildTree([
      mk(ROOT_B, SLIDE_B, ROOT_PATH, 0, "core.group"),
      mk(
        PEER_ID,
        SLIDE_B,
        childPath(ROOT_PATH, PEER_ID),
        0,
        "core.text",
        "footer",
      ),
    ] as any),
  );
  deck.components.set(SLIDE_A, [transform(TEXT_ID, 10, 10) as any]);
  deck.components.set(SLIDE_B, [transform(PEER_ID, 10, 10) as any]);
}

describe("history: content", () => {
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
  });

  it("undoes a component edit and redoes it", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    seedOneSlide(deck);

    const before = deck.getComponent(TEXT_ID, "core.transform")!.data.position
      .x;

    history.transact("Move", () => {
      deck.updateComponent({
        node: TEXT_ID,
        type: "core.transform",
        data: { position: { x: 999, y: 0 } },
      } as any);
    });

    expect(deck.getComponent(TEXT_ID, "core.transform")!.data.position.x).toBe(
      999,
    );

    await history.undo();
    expect(deck.getComponent(TEXT_ID, "core.transform")!.data.position.x).toBe(
      before,
    );

    await history.redo();
    expect(deck.getComponent(TEXT_ID, "core.transform")!.data.position.x).toBe(
      999,
    );
  });

  it("restores a deleted node", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    seedOneSlide(deck);

    history.transact("Delete", () => {
      deck.deleteNodes([deck.getNodeAsTree(TEXT_ID)!]);
    });

    expect(deck.getNodeById(TEXT_ID)).toBeUndefined();

    await history.undo();
    expect(deck.getNodeById(TEXT_ID)).toBeDefined();
    expect(deck.getComponent(TEXT_ID, "core.transform")).toBeDefined();
  });

  it("restores a peer write on another slide", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    seedKeyedPeers(deck);

    history.transact("Move", () => {
      deck.updateComponent({
        node: TEXT_ID,
        type: "core.transform",
        data: { position: { x: 999, y: 0 } },
      } as any);
    });

    expect(deck.getComponent(PEER_ID, "core.transform")!.data.position.x).toBe(
      999,
    );

    await history.undo();
    expect(deck.getComponent(PEER_ID, "core.transform")!.data.position.x).toBe(
      10,
    );
  });

  it("makes one entry for a whole transaction", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    seedOneSlide(deck);

    history.transact("Move", () => {
      for (let x = 1; x <= 20; x++)
        deck.updateComponent({
          node: TEXT_ID,
          type: "core.transform",
          data: { position: { x, y: 0 } },
        } as any);
    });

    expect(history.canUndo).toBe(true);

    await history.undo();
    expect(history.canUndo).toBe(false);
  });
});
