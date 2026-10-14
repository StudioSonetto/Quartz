import type Anthropic from "@anthropic-ai/sdk";

export type ToolOutput = {
  content:
    | string
    | Exclude<Anthropic.ToolResultBlockParam["content"], undefined>;
  isError?: boolean;
};

const ok = (value: unknown): ToolOutput => ({
  content: JSON.stringify(value ?? { ok: true }),
});
const fail = (message: string): ToolOutput => ({
  content: message,
  isError: true,
});

export function useApprenticeTools(deckId: string) {
  const deck = useDeckStore();
  const history = useHistoryStore();
  const { render } = useSnapshot();

  // Store writes target the current slide, so open it first.
  async function enter(slideId: string) {
    const index = deck.slides.findIndex((s) => s.id === slideId);

    if (index === -1) throw new Error(`no slide ${slideId}`);

    await deck.goToSlide(index);

    // Wait for the store's own load; a second fetch could land late and erase new nodes.
    await until(() => deck.trees.get(slideId)?.id).toBeTruthy({
      timeout: 15000,
      throwOnTimeout: true,
    });

    history.capture(slideId);
    await nextTick();
  }

  const blob64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve((reader.result as string).split(",")[1]!);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  function target(id: string) {
    const tree = deck.getNodeAsTree(id);

    if (!tree) return fail(`no node ${id}`);
    if (isNodeLocked(tree)) return fail(`${tree.name} is locked`);

    return tree;
  }

  const handlers: Record<
    string,
    (input: Record<string, any>) => Promise<ToolOutput>
  > = {
    async get_deck() {
      return ok(
        deck.slides.map((slide) => {
          const tree = deck.trees.get(slide.id);
          const list = deck.components.get(slide.id) ?? [];

          return {
            slide: slide.id,
            nodes: tree?.id
              ? flattenTree(tree).map((n) => ({
                  id: n.id,
                  type: n.type,
                  name: n.name,
                  parent: n.parent?.id ?? null,
                  locked: n.locked,
                  components: Object.fromEntries(
                    list
                      .filter((c) => c.node === n.id)
                      .map((c) => [c.type, c.data]),
                  ),
                }))
              : "not loaded — touch the slide to load it",
          };
        }),
      );
    },

    async add_slide() {
      const slide = await deck.insertNewSlides(deckId);

      return ok({ slide: slide.id, root: slide.root });
    },

    async delete_slide({ slide }) {
      if (deck.slides.length <= 1) return fail("can't delete the last slide");

      return (await deck.deleteSlides(slide))
        ? ok(null)
        : fail(`couldn't delete ${slide}`);
    },

    async create_node({ slide, parent, type, name }) {
      if (!getNodeType(type)) return fail(`unknown node type ${type}`);
      if (!isModuleUnlocked(type)) return fail(`${type} needs a paid module`);

      await enter(slide);

      const tree = deck.getNodeAsTree(parent);

      if (!tree || tree.slides !== slide)
        return fail(`no node ${parent} on slide ${slide}`);
      if (deck.currentSlides?.id !== slide)
        return fail(`slide ${slide} is no longer open; try again`);
      if (isNodeLocked(tree)) return fail(`${tree.name} is locked`);

      const node = deck.createNode(name, type, {
        parentId: parent,
        seed: true,
      });

      return node ? ok({ node }) : fail(`couldn't create ${type}`);
    },

    async remove_node({ node }) {
      const tree = target(node);

      if ("content" in tree) return tree;
      if (tree.path === ROOT_PATH) return fail("slide roots can't be removed");

      await enter(tree.slides);

      deck.deleteNodes([tree]);

      return deck.getNodeAsTree(node)
        ? fail(`couldn't remove ${tree.name}`)
        : ok(null);
    },

    async add_component({ node, type }) {
      const tree = target(node);

      if ("content" in tree) return tree;
      if (!getComponentType(type))
        return fail(`unknown component type ${type}`);

      await enter(tree.slides);

      deck.addComponent(node, type);

      return deck.getComponent(node, type)
        ? ok(null)
        : fail(`${type} can't be attached to ${tree.type}`);
    },

    async remove_component({ node, type }) {
      const tree = target(node);

      if ("content" in tree) return tree;
      if (!deck.getComponent(node, type))
        return fail(`${tree.name} has no ${type}`);

      await enter(tree.slides);

      deck.removeComponent(node, type);

      return deck.getComponent(node, type)
        ? fail(`${type} can't be removed from ${tree.name}`)
        : ok(null);
    },

    async set_component({ node, type, patch }) {
      const tree = target(node);

      if ("content" in tree) return tree;

      const component = deck.getComponent(node, type);

      if (!component)
        return fail(`${tree.name} has no ${type}; add_component first`);

      const shape = deepMerge(
        deepMerge(component.data, effectiveDefaults(tree.type, type)),
        getComponentType(type)?.ai?.items ?? {},
      );
      const error = checkPatch(shape, patch);

      if (error) return fail(error);

      await enter(tree.slides);
      deck.updateComponent({
        ...component,
        data: mergePatch(component.data, patch),
      });

      return ok(null);
    },

    async look({ slide }) {
      await enter(slide);

      const image = await render(SNAPSHOT_WIDTH, "image/png");

      if (!image) return fail("couldn't render that slide");

      return {
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: await blob64(image),
            },
          },
        ],
      };
    },
  };

  async function run(
    name: string,
    input: Record<string, any>,
  ): Promise<ToolOutput> {
    const handler = handlers[name];

    if (!handler) return fail(`unknown tool ${name}`);
    // Never write into a deck opened mid-turn.
    if (deck.openedDeck !== deckId) return fail("this deck is no longer open");

    try {
      return await handler(input ?? {});
    } catch (err) {
      return fail((err as Error).message);
    }
  }

  return { run };
}
