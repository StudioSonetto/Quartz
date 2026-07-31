import { getNodeType, canContain } from "~/modules/registry";
import { buildTree, flattenTree } from "~/utils/tree";
import { ROOT_PATH, childPath, isSelfOrDescendantPath } from "~/utils/nodePath";
import { outermostNodes } from "~/utils/selection";
import {
  nearestCommonAncestor,
  groupNodes,
  ungroupNodes,
} from "~/utils/nodeTreeOps";
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

  const selectedNodeIds = ref<string[]>([]);

  // Range anchor for shift-click: set by a plain/cmd click (see useNodeSelection),
  // never moved by shift extension, so every range extends from the same origin.
  const anchorId = ref<string | null>(null);

  const selectedIdSet = computed(() => new Set(selectedNodeIds.value));

  function isSelected(id: string): boolean {
    return selectedIdSet.value.has(id);
  }

  // Selection is scoped to the current slide, so resolve ids against its tree.
  const selectedNodes = computed<Tree[]>(() => {
    const tree = trees.value[currentSlidesIndex.value];
    if (!tree) return [];
    const byId = new Map(flattenTree(tree).map((n) => [n.id, n]));
    return selectedNodeIds.value
      .map((id) => byId.get(id))
      .filter((n): n is Tree => n !== undefined);
  });

  const soleSelected = computed<Tree | null>(() => {
    if (selectedNodeIds.value.length !== 1) return null;
    const tree = trees.value[currentSlidesIndex.value];
    return tree
      ? (flattenTree(tree).find((n) => n.id === selectedNodeIds.value[0]) ??
          null)
      : null;
  });

  const slidesInLoading = ref<Set<number>>(new Set());

  watch(slides, (newSlides) => {
    if (trees.value.length >= newSlides.length) return;
    trees.value.push(EMPTY_TREE);
    components.value.push([]);
  });

  // Load a slide's nodes when it first becomes current. Keyed on slide id, not
  // currentTree: every empty trees[] slot shares one EMPTY_TREE reference, so a
  // currentTree watch would never fire for the first slide.
  watch(
    () => currentSlides.value?.id,
    async (id) => {
      if (
        !id ||
        currentTree.value?.id ||
        slidesInLoading.value.has(currentSlidesIndex.value)
      )
        return;

      await Promise.all([
        fetchAllNodes(currentSlidesIndex.value),
        parallelLoad(),
      ]);
    },
    { immediate: true },
  );

  watch(currentSlidesIndex, () => {
    selectedNodeIds.value = [];
    anchorId.value = null;
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

  // Strip Tree wrappers (children/parent) back to plain NodeModel rows.
  function flatModels(): NodeModel[] {
    return currentFlat().map(({ children, parent, ...n }) => n);
  }

  // The default components a node of `type` ships with, freshly instantiated.
  function buildDefaultComponents(
    nodeId: string,
    type: NodeType,
  ): ComponentModel[] {
    return (getNodeType(type)?.defaultComponents ?? []).map((entry) => {
      const componentType = entryType(entry);
      return {
        node: nodeId,
        type: componentType,
        data: effectiveDefaults(type, componentType),
      } as ComponentModel;
    });
  }

  function createNode(name: string, type: NodeType) {
    if (!currentSlides.value) return;

    const id = crypto.randomUUID();
    const parentPath = soleSelected.value?.path ?? ROOT_PATH;
    const parentType: NodeType = soleSelected.value?.type ?? "core.group";
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

    const defaultComponents = buildDefaultComponents(id, type);

    trees.value[currentSlidesIndex.value] = buildTree([...flatModels(), node]);
    components.value[currentSlidesIndex.value]!.push(...defaultComponents);

    sync.enqueueNode(id);
    for (const c of defaultComponents) sync.enqueueComponent(c.node, c.type);

    selectedNodeIds.value = [id];
    anchorId.value = id;
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

  function deleteNodes(nodes: Tree[]) {
    if (!nodes.length) return;

    const roots = outermostNodes(nodes.filter((n) => n.path !== ROOT_PATH));

    if (!roots.length) return;

    const slideComponents = components.value[currentSlidesIndex.value] ?? [];
    const flat = currentFlat();
    const removed = flat.filter((n) =>
      roots.some((r) => isSelfOrDescendantPath(n.path, r.path)),
    );
    const removedIds = new Set(removed.map((n) => n.id));

    // Remove the nodes and their subtrees from local state.
    trees.value[currentSlidesIndex.value] = buildTree(
      flat
        .filter((n) => !removedIds.has(n.id))
        .map(({ children, parent, ...n }) => n),
    );
    // Purge the removed subtrees' components so they can't resolve in flush().
    components.value[currentSlidesIndex.value] = slideComponents.filter(
      (c) => !removedIds.has(c.node),
    );

    // Drop every removed id from the outbox before enqueuing the deletes.
    for (const n of removed) sync.dropNode(n.id);
    for (const r of roots)
      sync.enqueueDelete({ path: r.path, slides: r.slides }, r.id);
    selectedNodeIds.value = [];
    anchorId.value = null;
  }

  function deleteSelectedNodes() {
    deleteNodes(selectedNodes.value);
  }

  // The roots to wrap and their shared parent, or null if the selection can't
  // be grouped. Shared by the guard and the action so it's derived once.
  function planGroup(): { roots: Tree[]; ancestorPath: string } | null {
    const roots = outermostNodes(selectedNodes.value).filter(
      (n) => n.path !== ROOT_PATH,
    );

    if (roots.length < 2) return null;

    const ancestorPath = nearestCommonAncestor(roots.map((n) => n.path));
    const ancestor = currentFlat().find((n) => n.path === ancestorPath);
    const ancestorType: NodeType = ancestor?.type ?? "core.group";

    if (!canContain(ancestorType, "core.group")) return null;
    if (!roots.every((r) => canContain("core.group", r.type))) return null;

    return { roots, ancestorPath };
  }

  function groupSelection() {
    const plan = planGroup();
    if (!currentSlides.value || !plan) return;

    const { roots, ancestorPath } = plan;

    const id = crypto.randomUUID();
    const group: NodeModel = {
      id,
      slides: currentSlides.value.id,
      name: "Group",
      path: childPath(ancestorPath, id),
      type: "core.group",
      reference: null,
      sort_order: nextSiblingOrder(ancestorPath),
    };

    const nextFlat = groupNodes(
      flatModels(),
      roots.map((r) => r.path),
      group,
    );
    trees.value[currentSlidesIndex.value] = buildTree(nextFlat);

    // Group's default components (core.group ships transform + layout).
    const groupDefaults = buildDefaultComponents(id, "core.group");
    components.value[currentSlidesIndex.value]!.push(...groupDefaults);

    sync.enqueueNode(id);
    for (const c of groupDefaults) sync.enqueueComponent(c.node, c.type);
    // Every reparented node changed path → enqueue.
    for (const n of nextFlat) {
      if (n.path !== ROOT_PATH && n.id !== id) sync.enqueueNode(n.id);
    }
    selectedNodeIds.value = [id];
    anchorId.value = id;
  }

  function ungroupSelection() {
    const groups = selectedNodes.value.filter((n) => n.type === "core.group");
    if (!groups.length) return;

    let flat = flatModels();
    for (const g of groups) {
      flat = ungroupNodes(flat, g.id);
    }
    trees.value[currentSlidesIndex.value] = buildTree(flat);

    // Purge the dissolved groups' components and outbox entries; children survive.
    const groupIds = new Set(groups.map((g) => g.id));
    components.value[currentSlidesIndex.value] = (
      components.value[currentSlidesIndex.value] ?? []
    ).filter((c) => !groupIds.has(c.node));
    for (const g of groups) {
      sync.dropNode(g.id);
      sync.enqueueDelete({ path: g.path, slides: g.slides }, g.id);
    }
    for (const n of flat) {
      if (n.path !== ROOT_PATH) sync.enqueueNode(n.id);
    }
    selectedNodeIds.value = [];
    anchorId.value = null;
  }

  function selectAll() {
    const tree = trees.value[currentSlidesIndex.value];
    if (!tree) return;
    selectedNodeIds.value = flattenTree(tree)
      .filter((n) => n.path !== ROOT_PATH)
      .map((n) => n.id);
    anchorId.value = selectedNodeIds.value.at(-1) ?? null;
  }

  // After a drag reorders the tree, recompute path + sort_order from structure
  // and enqueue every node that changed.
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
    selectedNodeIds,
    anchorId,
    selectedNodes,
    soleSelected,
    isSelected,
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
    deleteSelectedNodes,
    groupSelection,
    ungroupSelection,
    selectAll,
    reorderNodes,
    updateComponent,
    nextSlides,
    prevSlides,
  };
});
