import { getNodeType, canContain } from "~/modules/registry";
import { buildTree, flattenTree } from "~/utils/tree";
import { ROOT_PATH, childPath } from "~/utils/nodePath";
import {
  normaliseComponents,
  effectiveDefaults,
  entryType,
} from "~/utils/normaliseComponents";

export const useDeckStore = defineStore("deck", () => {
  const apiFetch = useRequestFetch();
  const sync = useDeckSync();

  const slides = ref<SlidesModel[]>([]);
  const currentSlidesIndex = ref<number>(0);
  const currentSlides = computed(() => slides.value[currentSlidesIndex.value]);

  const trees = ref<Tree[]>([EMPTY_TREE]);
  const currentTree = computed(() => trees.value[currentSlidesIndex.value]);

  const components = ref<ComponentModel[][]>([]);
  const currentComponents = computed(
    () => components.value[currentSlidesIndex.value],
  );

  const selectedNode = ref<Tree | null>(null);
  const slidesInLoading = ref<Set<number>>(new Set());

  watch(slides, (newSlides) => {
    if (trees.value.length >= newSlides.length) return;
    trees.value.push(EMPTY_TREE);
    components.value.push([]);
  });

  // Load nodes for a slide the first time it becomes current.
  watch(currentTree, async () => {
    if (
      currentTree.value?.id ||
      slidesInLoading.value.has(currentSlidesIndex.value)
    )
      return;

    await fetchAllNodes(currentSlidesIndex.value);
    await parallelLoad();
  });

  watch(currentSlidesIndex, () => {
    selectedNode.value = null;
    sync.flush(); // best-effort flush on slide switch (non-blocking)
  });

  function currentFlat(): Tree[] {
    const tree = trees.value[currentSlidesIndex.value];
    return tree ? flattenTree(tree) : [];
  }

  // ---- Selectors used by the sync layer ----

  function getNodeById(id: string): NodeModel | undefined {
    for (const tree of trees.value) {
      const found = flattenTree(tree).find((n) => n.id === id);
      if (found) {
        const { children, parent, ...node } = found;
        return node;
      }
    }
    return undefined;
  }

  function getComponent(
    node: string,
    type: string,
  ): ComponentModel | undefined {
    for (const slideComponents of components.value) {
      const found = slideComponents.find(
        (c) => c.node === node && c.type === type,
      );
      if (found) return found;
    }
    return undefined;
  }

  // ---- Deck / slide CRUD (thin API passthroughs) ----

  async function fetchAllDecks() {
    return apiFetch("/api/decks");
  }

  async function fetchDeck(id: string) {
    return apiFetch(`/api/decks/${id}`);
  }

  async function insertNewDeck() {
    const data = await apiFetch<{ id: string }>("/api/decks", {
      method: "POST",
    });
    navigateTo(`/atelier/${data?.id}`, {
      external: true,
      open: { target: "_blank" },
    });
  }

  async function updateDeckTitle(title: string) {
    await apiFetch(`/api/decks/${useRoute().params.id}`, {
      method: "PATCH",
      body: { title },
    });
  }

  async function deleteDeck(id: string) {
    return apiFetch(`/api/decks/${id}`, { method: "DELETE" });
  }

  async function fetchAllSlides(deck: string) {
    const data = await apiFetch<SlidesModel[]>("/api/slides", {
      query: { deck },
    });
    if (data) slides.value = data;
    return data;
  }

  async function fetchSlides(deck: string, index: number) {
    return apiFetch<SlidesModel>("/api/slides", { query: { deck, index } });
  }

  async function insertNewSlides(deck: string) {
    return apiFetch("/api/slides", {
      method: "POST",
      body: { deck, index: slides.value.length },
    });
  }

  async function fetchAllNodes(
    index: number = currentSlidesIndex.value,
    deck?: string,
  ) {
    const id = deck
      ? (await fetchSlides(deck, index))?.id
      : slides.value?.[index]?.id;

    if (!id) return [];

    const [data, fetchedComponents] = await Promise.all([
      apiFetch<NodeModel[]>("/api/nodes", { query: { slides: id } }),
      apiFetch<ComponentModel[]>("/api/components", { query: { slides: id } }),
    ]);

    if (data) {
      const { components: normalised, enqueue } = normaliseComponents(
        data,
        fetchedComponents ?? [],
      );

      components.value[index] = normalised;
      trees.value[index] = buildTree(data);

      for (const { node, type } of enqueue) sync.enqueueComponent(node, type);

      return trees.value[index].children;
    }
    return [];
  }

  async function fetchNodeComponents(node: string) {
    return apiFetch<ComponentModel[]>(`/api/components/${node}`);
  }

  async function parallelLoad() {
    if (slidesInLoading.value.size >= slides.value.length) return;
    const slidesToLoad = slides.value
      .map((_, index) => index)
      .filter(
        (index) =>
          index !== currentSlidesIndex.value &&
          !trees.value[index]?.id &&
          !slidesInLoading.value.has(index),
      );
    await Promise.all(
      slidesToLoad.map(async (index) => {
        slidesInLoading.value.add(index);
        try {
          await fetchAllNodes(index);
        } finally {
          slidesInLoading.value.delete(index);
        }
      }),
    );
  }

  // ---- Mutations: mutate local state synchronously, then enqueue ----

  function nextSiblingOrder(parentPath: string): number {
    const siblings = currentFlat().filter(
      (n) => n.path.split(".").slice(0, -1).join(".") === parentPath,
    );
    return siblings.reduce((max, n) => Math.max(max, n.sort_order), -1) + 1;
  }

  function createNode(name: string, type: NodeType) {
    if (!currentSlides.value) return;

    const id = crypto.randomUUID();
    const parentPath = selectedNode.value?.path ?? ROOT_PATH;
    const parentType: NodeType = selectedNode.value?.type ?? "core.group";
    if (!canContain(parentType, type)) {
      throw new Error(`A ${type} cannot be placed inside a ${parentType} node`);
    }
    const path = childPath(parentPath, id);

    const node: NodeModel = {
      id,
      slides: currentSlides.value.id,
      name,
      path,
      type,
      reference: null,
      sort_order: nextSiblingOrder(parentPath),
    };

    const nodeDef = getNodeType(type);
    const defaultComponents: ComponentModel[] = (
      nodeDef?.defaultComponents ?? []
    ).map((entry) => {
      const componentType = entryType(entry);
      return {
        type: componentType,
        node: id,
        data: effectiveDefaults(type, componentType),
      } as ComponentModel;
    });

    trees.value[currentSlidesIndex.value] = buildTree([
      ...currentFlat().map(({ children, parent, ...n }) => n),
      node,
    ]);
    components.value[currentSlidesIndex.value]!.push(...defaultComponents);

    sync.enqueueNode(id);
    for (const c of defaultComponents) sync.enqueueComponent(c.node, c.type);

    selectedNode.value = getNodeAsTree(id);
  }

  function getNodeAsTree(id: string): Tree | null {
    for (const tree of trees.value) {
      const found = flattenTree(tree).find((n) => n.id === id);
      if (found) return found;
    }
    return null;
  }

  function updateNode(
    id: string,
    patch: Partial<Pick<NodeModel, "name" | "reference">>,
  ) {
    const target = getNodeAsTree(id);
    if (!target) return;
    Object.assign(target, patch);
    // Path is id-based, so name changes never touch the path — no reorder.
    sync.enqueueNode(id);
  }

  function deleteSelectedNode() {
    const node = selectedNode.value;
    if (!node || node.path === ROOT_PATH) return;

    const slideComponents = components.value[currentSlidesIndex.value] ?? [];
    const removed = currentFlat().filter(
      (n) => n.path === node.path || n.path.startsWith(`${node.path}.`),
    );
    const removedIds = new Set(removed.map((n) => n.id));

    // Remove the node and its subtree from local state.
    trees.value[currentSlidesIndex.value] = buildTree(
      currentFlat()
        .filter((n) => !removedIds.has(n.id))
        .map(({ children, parent, ...n }) => n),
    );
    // Purge the removed subtree's components so they can't resolve in flush().
    components.value[currentSlidesIndex.value] = slideComponents.filter(
      (c) => !removedIds.has(c.node),
    );

    // Drop every removed id from the outbox before enqueuing the delete.
    for (const n of removed) sync.dropNode(n.id);
    sync.enqueueDelete({ path: node.path, slides: node.slides }, node.id);
    selectedNode.value = null;
  }

  // Renormalize path + sort_order from the current tree STRUCTURE after a drag
  // library has moved nodes between children arrays, then enqueue every node
  // whose path or sort_order actually changed.
  function reorderNodes() {
    const root = trees.value[currentSlidesIndex.value];
    if (!root) return;

    const changed: string[] = [];

    const walk = (
      node: Tree,
      parentPath: string,
      index: number,
      isRoot: boolean,
    ) => {
      const newPath = isRoot ? ROOT_PATH : childPath(parentPath, node.id);
      const newOrder = isRoot ? node.sort_order : index;
      if (node.path !== newPath || node.sort_order !== newOrder) {
        node.path = newPath;
        node.sort_order = newOrder;
        if (!isRoot) changed.push(node.id);
      }
      node.children.forEach((child, i) => walk(child, newPath, i, false));
    };

    walk(root, "", 0, true);

    // Rebuild to restore parent refs and canonical sort_order-sorted children.
    trees.value[currentSlidesIndex.value] = buildTree(
      flattenTree(root).map(({ children, parent, ...n }) => n),
    );

    for (const id of changed) sync.enqueueNode(id);
  }

  function updateComponent(component: ComponentModel) {
    const slideComponents = components.value[currentSlidesIndex.value];
    if (!slideComponents) return;
    const index = slideComponents.findIndex(
      (c) => c.node === component.node && c.type === component.type,
    );
    if (index !== -1) slideComponents[index] = component;
    else slideComponents.push(component);

    sync.enqueueComponent(component.node, component.type);
  }

  function nextSlides() {
    if (currentSlidesIndex.value >= slides.value.length - 1) return;
    currentSlidesIndex.value++;
  }
  function prevSlides() {
    if (currentSlidesIndex.value <= 0) return;
    currentSlidesIndex.value--;
  }

  return {
    slides,
    currentSlides,
    currentSlidesIndex,
    trees,
    currentTree,
    components,
    currentComponents,
    selectedNode,
    currentFlat,
    getNodeById,
    getComponent,
    fetchAllDecks,
    fetchDeck,
    insertNewDeck,
    deleteDeck,
    updateDeckTitle,
    fetchAllSlides,
    fetchSlides,
    insertNewSlides,
    fetchAllNodes,
    fetchNodeComponents,
    createNode,
    updateNode,
    deleteSelectedNode,
    reorderNodes,
    updateComponent,
    nextSlides,
    prevSlides,
  };
});
