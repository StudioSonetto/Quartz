import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { core } from "~/modules/core";
import { registerModule, __resetRegistry } from "~/modules/registry";

const hoisted = vi.hoisted(() => ({ fetchMock: () => new Promise(() => {}) }));
mockNuxtImport("useRequestFetch", () => () => hoisted.fetchMock);
mockNuxtImport("useSupabaseClient", () => () => ({ storage: { from: () => ({}) } }));

const SLIDE = "slide-1";
const ROOT_ID = "root-id";

function seed(store: ReturnType<typeof useDeckStore>) {
  store.openedDeck = "deck-1";
  store.slides = [{ id: SLIDE, deck: "deck-1", index: 0 }] as any;
  store.currentSlidesIndex = 0;
  store.trees = new Map([
    [SLIDE, buildTree([{ id: ROOT_ID, slides: SLIDE, name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 }] as any)],
  ]);
  store.components = new Map([[SLIDE, [{ id: "layout-id", node: ROOT_ID, type: "core.layout", data: {} }] as any]]);
}

describe("useApprenticeTools", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    __resetRegistry();
    registerModule(core);
  });

  it("creates a node and returns its id", async () => {
    const store = useDeckStore();
    seed(store);

    const out = await useApprenticeTools("deck-1").run("create_node", {
      slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "Title",
    });

    expect(out.isError).toBeFalsy();
    expect(store.getNodeAsTree(JSON.parse(out.content as string).node)?.name).toBe("Title");
  });

  it("rejects a mistyped patch and leaves the data alone", async () => {
    const store = useDeckStore();
    seed(store);
    const { node } = JSON.parse(
      (await useApprenticeTools("deck-1").run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "T" })).content as string,
    );
    const before = store.getComponent(node, "core.typography")?.data;

    const out = await useApprenticeTools("deck-1").run("set_component", {
      node, type: "core.typography", patch: { size: "huge" },
    });

    expect(out.isError).toBe(true);
    expect(out.content).toContain("size must be a number");
    expect(store.getComponent(node, "core.typography")?.data).toEqual(before);
  });

  it("accepts a background colour, a numeric width and \"auto\" again", async () => {
    const store = useDeckStore();
    seed(store);
    const tools = useApprenticeTools("deck-1");
    const { node } = JSON.parse((await tools.run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "T" })).content as string);

    const background = await tools.run("set_component", { node: ROOT_ID, type: "core.layout", patch: { background: { type: "colour", value: "#111" } } });
    const wide = await tools.run("set_component", { node, type: "core.transform", patch: { size: { width: 800 } } });
    const auto = await tools.run("set_component", { node, type: "core.transform", patch: { size: { width: "auto" } } });

    expect([background, wide, auto].map((o) => o.content)).toEqual(['{"ok":true}', '{"ok":true}', '{"ok":true}']);
    expect(store.getComponent(ROOT_ID, "core.layout")?.data.background).toEqual({ type: "colour", value: "#111" });
    expect(store.getComponent(node, "core.transform")?.data.size.width).toBe("auto");
  });

  it("refuses a parent from another slide and creates nothing", async () => {
    const store = useDeckStore();
    seed(store);
    store.slides = [...store.slides, { id: "slide-2", deck: "deck-1", index: 1 }] as any;
    store.trees.set("slide-2", buildTree([{ id: "root-2", slides: "slide-2", name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 }] as any));
    store.components.set("slide-2", []);

    const out = await useApprenticeTools("deck-1").run("create_node", { slide: "slide-2", parent: ROOT_ID, type: "core.text", name: "x" });

    expect(out.isError).toBe(true);
    expect(flattenTree(store.trees.get(SLIDE)!)).toHaveLength(1);
    expect(flattenTree(store.trees.get("slide-2")!)).toHaveLength(1);
  });

  it("refuses to write once the deck is no longer open", async () => {
    const store = useDeckStore();
    seed(store);
    store.openedDeck = "deck-2";

    const out = await useApprenticeTools("deck-1").run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "x" });

    expect(out.isError).toBe(true);
    expect(flattenTree(store.trees.get(SLIDE)!)).toHaveLength(1);
  });

  it("refuses to remove a slide root", async () => {
    seed(useDeckStore());

    const out = await useApprenticeTools("deck-1").run("remove_node", { node: ROOT_ID });

    expect(out.isError).toBe(true);
  });

  it("refuses to delete the last slide", async () => {
    seed(useDeckStore());

    const out = await useApprenticeTools("deck-1").run("delete_slide", { slide: SLIDE });

    expect(out.isError).toBe(true);
  });

  it("waits for the store to load a slide before touching it", async () => {
    const store = useDeckStore();
    seed(store);
    store.slides = [...store.slides, { id: "slide-2", deck: "deck-1", index: 1 }] as any;

    const out = useApprenticeTools("deck-1").run("create_node", { slide: "slide-2", parent: "root-2", type: "core.text", name: "x" });

    await nextTick();
    store.components.set("slide-2", []);
    store.trees.set("slide-2", buildTree([{ id: "root-2", slides: "slide-2", name: "root", path: ROOT_PATH, type: "core.group", reference: null, sort_order: 0 }] as any));

    expect((await out).isError).toBeFalsy();
  });

  it("refuses to remove a guaranteed component", async () => {
    const store = useDeckStore();
    seed(store);
    const { node } = JSON.parse(
      (await useApprenticeTools("deck-1").run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "T" })).content as string,
    );

    const out = await useApprenticeTools("deck-1").run("remove_component", { node, type: "core.base" });

    expect(out.isError).toBe(true);
    expect(store.getComponent(node, "core.base")).toBeTruthy();
  });

  it("refuses to patch a locked node", async () => {
    const store = useDeckStore();
    seed(store);
    const { node } = JSON.parse(
      (await useApprenticeTools("deck-1").run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "core.text", name: "T" })).content as string,
    );
    store.getNodeAsTree(node)!.locked = true;

    const out = await useApprenticeTools("deck-1").run("set_component", { node, type: "core.typography", patch: { size: 50 } });

    expect(out.isError).toBe(true);
    expect(out.content).toContain("locked");
  });

  it("fails on an unknown node type without navigating", async () => {
    const store = useDeckStore();
    seed(store);
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    const out = await useApprenticeTools("deck-1").run("create_node", { slide: SLIDE, parent: ROOT_ID, type: "nope.thing", name: "x" });

    expect(out.isError).toBe(true);
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("reports an unknown tool as an error", async () => {
    seed(useDeckStore());

    expect((await useApprenticeTools("deck-1").run("nope", {})).isError).toBe(true);
  });
});
