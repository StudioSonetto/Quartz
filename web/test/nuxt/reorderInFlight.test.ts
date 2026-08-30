import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";

const hoisted = vi.hoisted(() => {
  const calls: Array<{ url: string; body: any; resolve: () => void }> = [];
  const fetchMock = (url: string, opts: any) => {
    let resolve!: () => void;
    const p = new Promise<void>((r) => (resolve = () => r()));
    calls.push({ url, body: opts?.body, resolve });
    return p;
  };
  return { calls, fetchMock };
});

mockNuxtImport("useRequestFetch", () => () => hoisted.fetchMock);

const ids = (deck: any) => deck.slides.map((s: any) => s.id);
const orders = () =>
  hoisted.calls.filter((c) => c.body?.order).map((c) => c.body.order.join());

async function drain() {
  for (let i = 0; i < 20; i++) {
    for (const c of hoisted.calls) c.resolve();
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("reorder while a save is in flight", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hoisted.calls.length = 0;
  });

  it("resaves and records one entry per drag", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    deck.slides = [
      { id: "a", deck: "d", index: 0 },
      { id: "b", deck: "d", index: 1 },
      { id: "c", deck: "d", index: 2 },
    ] as any;

    deck.slides = [deck.slides[1], deck.slides[0], deck.slides[2]] as any;
    const first = deck.reorderSlides(["a", "b", "c"]);

    deck.slides = [deck.slides[0], deck.slides[2], deck.slides[1]] as any;
    const second = deck.reorderSlides(["b", "a", "c"]);

    await drain();
    await first;
    await second;

    expect(orders()).toEqual(["b,a,c", "b,c,a"]);
    expect(history.canUndo).toBe(true);

    let undoing = history.undo();
    await drain();
    await undoing;

    expect(ids(deck)).toEqual(["b", "a", "c"]);

    undoing = history.undo();
    await drain();
    await undoing;

    expect(ids(deck)).toEqual(["a", "b", "c"]);
  });

  it("offers the undo before the save resolves", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    deck.slides = [
      { id: "a", deck: "d", index: 0 },
      { id: "b", deck: "d", index: 1 },
    ] as any;

    deck.slides = [deck.slides[1], deck.slides[0]] as any;

    const saving = deck.reorderSlides(["a", "b"]);

    expect(history.canUndo).toBe(true);

    await drain();
    await saving;
  });

  it("records a drag made while an undo is still saving", async () => {
    const deck = useDeckStore();
    const history = useHistoryStore();

    deck.slides = [
      { id: "a", deck: "d", index: 0 },
      { id: "b", deck: "d", index: 1 },
      { id: "c", deck: "d", index: 2 },
    ] as any;

    deck.slides = [deck.slides[1], deck.slides[0], deck.slides[2]] as any;
    const first = deck.reorderSlides(["a", "b", "c"]);

    const undoing = history.undo();

    await new Promise((r) => setTimeout(r, 0));

    expect(history.canUndo).toBe(false);

    deck.slides = [deck.slides[0], deck.slides[2], deck.slides[1]] as any;
    const second = deck.reorderSlides(["a", "b", "c"]);

    expect(history.canUndo).toBe(true);

    await drain();
    await Promise.all([first, second, undoing]);
  });
});
