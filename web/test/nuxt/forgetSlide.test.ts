import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

const mk = (id: string, slides: string, path: string, type = "core.text") => ({
  id,
  slides,
  name: id,
  path,
  type,
  reference: null,
  sort_order: 0,
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

const T1 = "11111111-1111-1111-1111-111111111111";
const T2 = "22222222-2222-2222-2222-222222222222";

function seed(deck: ReturnType<typeof useDeckStore>) {
  deck.slides = [{ id: "s1" }, { id: "s2" }] as any;
  deck.currentSlidesIndex = 0;

  for (const [slide, text] of [
    ["s1", T1],
    ["s2", T2],
  ] as const) {
    deck.trees.set(
      slide,
      buildTree([
        mk(`root-${slide}`, slide, ROOT_PATH, "core.group"),
        mk(text, slide, childPath(ROOT_PATH, text)),
      ] as any),
    );
    deck.components.set(slide, [
      {
        node: text,
        type: "core.transform",
        data: { position: { x: 10, y: 10 } },
      },
    ] as any);
  }
}

const x = (deck: ReturnType<typeof useDeckStore>, id: string) =>
  deck.getComponent(id, "core.transform")!.data.position.x;

describe("history: forgetSlide", () => {
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

  it("drops one slide's entries and keeps the others", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    seed(deck);

    history.transact("Move", () => {
      deck.updateComponent({
        node: T1,
        type: "core.transform",
        data: { position: { x: 100, y: 0 } },
      } as any);
    });

    deck.currentSlidesIndex = 1;

    history.transact("Move", () => {
      deck.updateComponent({
        node: T2,
        type: "core.transform",
        data: { position: { x: 200, y: 0 } },
      } as any);
    });

    expect(history.forgetSlide("s1")).toBe(true);

    await history.undo();

    expect(x(deck, T2)).toBe(10);
    expect(x(deck, T1)).toBe(100);
    expect(history.canUndo).toBe(false);
    expect(history.forgetSlide("s1")).toBe(false);
  });
});
