export const useDeckStore = defineStore("deck", () => {
  const apiFetch = useRequestFetch();
  const sync = useDeckSync();

  const slides = ref<SlidesModel[]>([]);

  const currentSlideId = ref<string | null>(null);

  const currentSlides = computed(
    () =>
      slides.value.find((s) => s.id === currentSlideId.value) ??
      slides.value[0],
  );

  const currentSlidesIndex = computed<number>({
    get: () => {
      const i = slides.value.findIndex((s) => s.id === currentSlideId.value);
      return i === -1 ? 0 : i;
    },
    set: (i) => {
      const id = slides.value[i]?.id;
      if (id) currentSlideId.value = id;
    },
  });

  const trees = ref<Map<string, Tree>>(new Map());
  const components = ref<Map<string, ComponentModel[]>>(new Map());

  function forgetSlide(id: string) {
    trees.value.delete(id);
    components.value.delete(id);
    slidesInLoading.value.delete(id);
  }

  const treeAt = (i: number) => {
    const id = slides.value[i]?.id;
    return id ? trees.value.get(id) : undefined;
  };
  const componentsAt = (i: number) => {
    const id = slides.value[i]?.id;
    return id ? components.value.get(id) : undefined;
  };

  const currentTree = computed(() => treeAt(currentSlidesIndex.value));
  const currentComponents = computed(() =>
    componentsAt(currentSlidesIndex.value),
  );

  const selectedNodeIds = ref<string[]>([]);

  const anchorId = ref<string | null>(null);

  interface ClipboardEntry {
    nodes: NodeModel[];
    components: ComponentModel[];
    rootId: string;
  }
  const clipboard = ref<ClipboardEntry[] | null>(null);

  const pasteSlots = new Map<string, number>();

  const selectedIdSet = computed(() => new Set(selectedNodeIds.value));

  function isSelected(id: string): boolean {
    return selectedIdSet.value.has(id);
  }

  const selectedNodes = computed<Tree[]>(() => {
    const tree = currentTree.value;

    if (!tree) return [];

    const byId = new Map(flattenTree(tree).map((n) => [n.id, n]));

    return selectedNodeIds.value
      .map((id) => byId.get(id))
      .filter((n): n is Tree => n !== undefined);
  });

  const soleSelected = computed<Tree | null>(() => {
    if (selectedNodeIds.value.length !== 1) return null;

    const tree = currentTree.value;

    return tree
      ? (flattenTree(tree).find((n) => n.id === selectedNodeIds.value[0]) ??
          null)
      : null;
  });

  const slidesInLoading = ref<Set<string>>(new Set());

  const allSlidesLoaded = computed(() =>
    slides.value.every((s) => !!trees.value.get(s.id)?.id),
  );

  watch(
    () => currentSlides.value?.id,
    async (id) => {
      if (!id || currentTree.value?.id || slidesInLoading.value.has(id)) return;

      await Promise.all([
        fetchAllNodes(currentSlidesIndex.value),
        parallelLoad(),
      ]);
    },
    { immediate: true },
  );

  watch(
    () => currentSlides.value?.id,
    (id) => {
      if (!id) return;

      selectedNodeIds.value = [];
      anchorId.value = null;

      sync.flush();
    },
  );

  function currentFlat(): Tree[] {
    const tree = currentTree.value;
    return tree ? flattenTree(tree) : [];
  }

  // ---- Selectors used by the sync layer ----

  // `parallelLoad` resolves out of order, so mid-load these maps hold gaps.

  function getNodeById(id: string): NodeModel | undefined {
    for (const tree of trees.value.values()) {
      if (!tree?.id) continue;
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
    for (const slideComponents of components.value.values()) {
      if (!slideComponents) continue;
      const found = slideComponents.find(
        (c) => c.node === node && c.type === type,
      );
      if (found) return found;
    }
    return undefined;
  }

  function locateNode(id: string): { node: Tree; slideIndex: number } | null {
    const findIn = (i: number) => {
      const tree = treeAt(i);
      if (!tree?.id) return null;

      const found = flattenTree(tree).find((n) => n.id === id);
      return found ? { node: found, slideIndex: i } : null;
    };

    const current = findIn(currentSlidesIndex.value);
    if (current) return current;

    for (let i = 0; i < slides.value.length; i++) {
      if (i === currentSlidesIndex.value) continue;

      const found = findIn(i);
      if (found) return found;
    }
    return null;
  }

  function slideIndexOf(nodeId: string): number | null {
    return locateNode(nodeId)?.slideIndex ?? null;
  }

  function componentsOf(nodeId: string): ComponentModel[] {
    for (const slideComponents of components.value.values()) {
      if (!slideComponents) continue;
      const found = slideComponents.filter((c) => c.node === nodeId);
      if (found.length) return found;
    }
    return [];
  }

  function peersOf(
    id: string,
    located: { node: Tree; slideIndex: number } | null = locateNode(id),
  ): { node: Tree; slideIndex: number }[] {
    if (!located) return [];

    const { reference: key, type } = located.node;
    if (!key) return [];

    const out: { node: Tree; slideIndex: number }[] = [];
    slides.value.forEach((_, slideIndex) => {
      if (slideIndex === located.slideIndex) return;

      const tree = treeAt(slideIndex);
      if (!tree?.id) return;

      for (const n of flattenTree(tree)) {
        if (n.reference === key && n.type === type)
          out.push({ node: n, slideIndex });
      }
    });
    return out;
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
    if (data) {
      slides.value = data;

      const live = new Set(data.map((s) => s.id));

      const known = [
        ...trees.value.keys(),
        ...components.value.keys(),
        ...slidesInLoading.value,
      ];

      for (const id of known) if (!live.has(id)) forgetSlide(id);
    }
    return data;
  }

  async function fetchSlides(deck: string, index: number) {
    return apiFetch<SlidesModel>("/api/slides", { query: { deck, index } });
  }

  const insertingSlides = ref(false);

  async function insertNewSlides(deck: string) {
    if (insertingSlides.value) return;

    insertingSlides.value = true;

    try {
      const slide = await apiFetch<SlidesModel>("/api/slides", {
        method: "POST",
        body: { deck, index: slides.value.length },
      });

      if (slide) slides.value = [...slides.value, slide];

      return slide;
    } finally {
      insertingSlides.value = false;
    }
  }

  async function deleteSlides(id: string) {
    const index = slides.value.findIndex((s) => s.id === id);

    if (index === -1 || slides.value.length <= 1) return;

    const deck = slides.value[index]!.deck;
    const previousSlideId = currentSlideId.value;

    sync.dropSlide(id);
    forgetSlide(id);

    slides.value = slides.value
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, index: i }));

    if (currentSlideId.value === id)
      currentSlideId.value =
        slides.value[Math.min(index, slides.value.length - 1)]!.id;

    try {
      await apiFetch(`/api/slides/${id}`, { method: "DELETE" });
    } catch {
      // Nothing was deleted, so the user must not be left on a different slide.
      currentSlideId.value = previousSlideId;

      await fetchAllSlides(deck).catch(() => {});
      await parallelLoad().catch(() => {});
    }
  }

  const reorderingSlides = ref(false);
  let resaveWanted = false;

  async function reorderSlides() {
    const deck = slides.value[0]?.deck;

    if (!deck) return;

    slides.value = slides.value.map((s, i) => ({ ...s, index: i }));

    if (reorderingSlides.value) {
      resaveWanted = true;

      return;
    }

    reorderingSlides.value = true;

    try {
      do {
        resaveWanted = false;
        await apiFetch(`/api/decks/${deck}/slides`, {
          method: "PATCH",
          body: { order: slides.value.map((s) => s.id) },
        });
      } while (resaveWanted);
    } catch (err) {
      // Undoing by index cannot be right once another drag has landed, so
      // take the server's order as truth instead.
      await fetchAllSlides(deck).catch(() => {});

      throw err;
    } finally {
      reorderingSlides.value = false;
    }
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
      // Write by id — a slide can be deleted while this fetch is in flight.
      if (!slides.value.some((s) => s.id === id)) return [];

      const slideComponents = normaliseComponents(
        data,
        fetchedComponents ?? [],
      );
      const tree = buildTree(data);

      components.value.set(id, slideComponents);
      trees.value.set(id, tree);

      ensureFonts(fontsInComponents(slideComponents));

      return tree.children;
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
          !trees.value.get(slides.value[index]!.id)?.id &&
          !slidesInLoading.value.has(slides.value[index]!.id),
      );
    await Promise.all(
      slidesToLoad.map(async (index) => {
        const id = slides.value[index]?.id;
        if (!id) return;

        slidesInLoading.value.add(id);
        try {
          await fetchAllNodes(index);
        } finally {
          slidesInLoading.value.delete(id);
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

  function createNode(
    name: string,
    type: NodeType,
    opts: {
      parentId?: string;
      position?: { x: number; y: number };
      seed?: boolean;
    } = {},
  ) {
    if (!currentSlides.value) return;

    const id = crypto.randomUUID();
    const explicitParent = opts.parentId
      ? getNodeAsTree(opts.parentId)
      : undefined;
    if (opts.parentId && !explicitParent) return;

    const parent = explicitParent ?? soleSelected.value;
    const parentPath = parent?.path ?? ROOT_PATH;
    const parentType: NodeType = parent?.type ?? "core.group";

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

    if (opts.position) {
      const transform = defaultComponents.find(
        (c) => c.type === "core.transform",
      );

      if (transform)
        transform.data.position = {
          ...transform.data.position,
          x: opts.position.x,
          y: opts.position.y,
        };
    }

    const slideId = currentSlides.value.id;

    trees.value.set(slideId, buildTree([...flatModels(), node]));
    const slideComponents = components.value.get(slideId) ?? [];
    slideComponents.push(...defaultComponents);
    components.value.set(slideId, slideComponents);

    sync.enqueueNode(id);
    for (const c of defaultComponents) sync.enqueueComponent(c.node, c.type);

    selectedNodeIds.value = [id];
    anchorId.value = id;

    if (!opts.seed) getNodeType(type)?.onCreate?.(id);

    return id;
  }

  function getNodeAsTree(id: string): Tree | null {
    return locateNode(id)?.node ?? null;
  }

  function updateNode(
    id: string,
    patch: Partial<Pick<NodeModel, "name" | "reference">>,
  ) {
    const target = getNodeAsTree(id);

    if (!target) return;

    Object.assign(target, patch);

    sync.enqueueNode(id);

    if (patch.name === undefined || patch.reference !== undefined) return;

    for (const { node } of peersOf(id)) {
      node.name = patch.name;
      sync.enqueueNode(node.id);
    }
  }

  function deleteNodes(nodes: Tree[]) {
    if (!nodes.length) return;

    const roots = outermostNodes(nodes.filter((n) => n.path !== ROOT_PATH));

    if (!roots.length) return;

    const slideId = currentSlides.value?.id;
    if (!slideId) return;

    const slideComponents = components.value.get(slideId) ?? [];
    const flat = currentFlat();
    const removed = flat.filter((n) =>
      roots.some((r) => isSelfOrDescendantPath(n.path, r.path)),
    );
    const removedIds = new Set(removed.map((n) => n.id));

    // Remove the nodes and their subtrees from local state.
    trees.value.set(
      slideId,
      buildTree(
        flat
          .filter((n) => !removedIds.has(n.id))
          .map(({ children, parent, ...n }) => n),
      ),
    );
    // Purge the removed subtrees' components so they can't resolve in flush().
    components.value.set(
      slideId,
      slideComponents.filter((c) => !removedIds.has(c.node)),
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

  function selectionRoots(): Tree[] {
    return outermostNodes(selectedNodes.value).filter(
      (n) => n.path !== ROOT_PATH,
    );
  }

  function selectNodes(ids: string[]) {
    if (!ids.length) return;
    selectedNodeIds.value = ids;
    anchorId.value = ids[ids.length - 1]!;
  }

  function planGroup(): { roots: Tree[]; ancestorPath: string } | null {
    const roots = selectionRoots();

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

    const nextFlat = canonicaliseSortOrder(
      groupNodes(
        flatModels(),
        roots.map((r) => r.path),
        group,
      ),
    );
    const slideId = currentSlides.value.id;
    trees.value.set(slideId, buildTree(nextFlat));

    // Group's default components (core.group ships transform + layout).
    const groupDefaults = buildDefaultComponents(id, "core.group");
    const slideComponents = components.value.get(slideId) ?? [];
    slideComponents.push(...groupDefaults);
    components.value.set(slideId, slideComponents);

    sync.enqueueNode(id);
    for (const c of groupDefaults) sync.enqueueComponent(c.node, c.type);
    // Persist every node — reparented ones changed path, and recanonicalisation
    // may have changed sibling sort_order.
    for (const n of nextFlat) {
      if (n.path !== ROOT_PATH && n.id !== id) sync.enqueueNode(n.id);
    }
    selectedNodeIds.value = [id];
    anchorId.value = id;

    getNodeType("core.group")?.onCreate?.(id);
  }

  function ungroupSelection() {
    const groups = selectedNodes.value.filter(
      (n) => n.type === "core.group" && n.path !== ROOT_PATH,
    );

    if (!groups.length) return;

    const slideId = currentSlides.value?.id;
    if (!slideId) return;

    let flat = flatModels();

    for (const g of groups) {
      flat = ungroupNodes(flat, g.id);
    }

    flat = canonicaliseSortOrder(flat);

    trees.value.set(slideId, buildTree(flat));

    const groupIds = new Set(groups.map((g) => g.id));

    components.value.set(
      slideId,
      (components.value.get(slideId) ?? []).filter(
        (c) => !groupIds.has(c.node),
      ),
    );

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

  // Insert already-cloned nodes/components (fresh ids) under `destPath`,
  // rebasing the clone root's path onto that parent + a fresh sort_order.
  function insertClone(
    clone: { nodes: NodeModel[]; components: ComponentModel[]; rootId: string },
    destPath: string,
  ): string {
    const root = clone.nodes.find((n) => n.id === clone.rootId);
    if (!root || !currentSlides.value) return "";

    const newRootPath = childPath(destPath, root.id);
    const oldRootPath = root.path;
    const slidesId = currentSlides.value.id;
    const rebased = clone.nodes.map((n) => {
      if (n.path === oldRootPath)
        return {
          ...n,
          slides: slidesId,
          path: newRootPath,
          sort_order: nextSiblingOrder(destPath),
        };
      return {
        ...n,
        slides: slidesId,
        path: newRootPath + n.path.slice(oldRootPath.length),
      };
    });

    trees.value.set(slidesId, buildTree([...flatModels(), ...rebased]));
    const slideComponents = components.value.get(slidesId) ?? [];
    slideComponents.push(...clone.components);
    components.value.set(slidesId, slideComponents);

    for (const n of rebased) sync.enqueueNode(n.id);
    for (const c of clone.components) sync.enqueueComponent(c.node, c.type);
    return root.id;
  }

  const CLONE_OFFSET = { x: 24, y: 24 };

  function duplicateSelection() {
    const roots = selectionRoots();
    if (!roots.length) return;
    const slideId = currentSlides.value?.id;
    if (!slideId) return;
    const flat = flatModels();
    const slideComps = components.value.get(slideId) ?? [];
    const newIds: string[] = [];
    for (const r of roots) {
      const clone = cloneSubtree(flat, slideComps, r.id, {
        offset: CLONE_OFFSET,
      });
      for (const n of clone.nodes) n.reference = null;
      const id = insertClone(clone, parentPath(r.path));
      if (id) newIds.push(id);
    }
    selectNodes(newIds);
  }

  function copySelection() {
    const roots = selectionRoots();
    if (!roots.length) return;
    const slideId = currentSlides.value?.id;
    if (!slideId) return;
    const flat = flatModels();
    const slideComps = components.value.get(slideId) ?? [];
    pasteSlots.clear();
    clipboard.value = roots.map((r) => {
      const sub = flat.filter((n) => isSelfOrDescendantPath(n.path, r.path));
      const subIds = new Set(sub.map((n) => n.id));
      const comps = slideComps.filter((c) => subIds.has(c.node));
      return {
        nodes: JSON.parse(JSON.stringify(sub)) as NodeModel[],
        components: JSON.parse(JSON.stringify(comps)) as ComponentModel[],
        rootId: r.id,
      };
    });
  }

  function cutSelection() {
    copySelection();
    deleteSelectedNodes();
  }

  function paste() {
    if (!clipboard.value?.length || !currentSlides.value) return;

    const parent = soleSelected.value;
    const destPath = parent?.path ?? ROOT_PATH;
    const parentType: NodeType = parent?.type ?? "core.group";
    const newIds: string[] = [];
    for (const entry of clipboard.value) {
      const source = entry.nodes.find((n) => n.id === entry.rootId);

      if (!source || !canContain(parentType, source.type)) continue;

      const destKeys = new Set(
        currentFlat()
          .map((n) => n.reference)
          .filter((r): r is string => !!r),
      );
      const wouldDuplicatePeer = entry.nodes.some(
        (n) => n.reference && destKeys.has(n.reference),
      );

      const sameSlide = source.slides === currentSlides.value.id;
      const detach = sameSlide || wouldDuplicatePeer;

      const slotKey = `${entry.rootId}:${currentSlides.value.id}`;
      const steps = pasteSlots.get(slotKey) ?? (detach ? 1 : 0);
      pasteSlots.set(slotKey, steps + 1);

      // Re-clone from the stored entry so repeated pastes get fresh ids.
      const clone = cloneSubtree(entry.nodes, entry.components, entry.rootId, {
        offset: steps
          ? { x: CLONE_OFFSET.x * steps, y: CLONE_OFFSET.y * steps }
          : undefined,
      });

      if (detach) for (const n of clone.nodes) n.reference = null;

      const id = insertClone(clone, destPath);

      if (id) newIds.push(id);
    }
    selectNodes(newIds);
  }

  function selectAll() {
    const tree = currentTree.value;

    if (!tree) return;

    selectedNodeIds.value = flattenTree(tree)
      .filter((n) => n.path !== ROOT_PATH)
      .map((n) => n.id);
    anchorId.value = selectedNodeIds.value.at(-1) ?? null;
  }

  function reorderNodes() {
    const slideId = currentSlides.value?.id;
    const root = currentTree.value;

    if (!root || !slideId) return;

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
    trees.value.set(
      slideId,
      buildTree(flattenTree(root).map(({ children, parent, ...n }) => n)),
    );

    for (const id of changed) sync.enqueueNode(id);
  }

  function writeComponentAt(slideIndex: number, component: ComponentModel) {
    const slideComponents = componentsAt(slideIndex);
    if (!slideComponents) return;

    const index = slideComponents.findIndex(
      (c) => c.node === component.node && c.type === component.type,
    );
    if (index !== -1) slideComponents[index] = component;
    else slideComponents.push(component);

    sync.enqueueComponent(component.node, component.type);
  }

  function updateComponent(component: ComponentModel) {
    const located = locateNode(component.node);

    writeComponentAt(
      located?.slideIndex ?? currentSlidesIndex.value,
      component,
    );

    if (!located?.node.reference) return;

    for (const { slideIndex, node } of peersOf(component.node, located)) {
      writeComponentAt(slideIndex, {
        ...component,
        node: node.id,
        data: JSON.parse(JSON.stringify(component.data)),
      });
    }
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
    clipboard,
    selectedNodes,
    soleSelected,
    isSelected,
    allSlidesLoaded,
    currentFlat,
    getNodeById,
    getComponent,
    getNodeAsTree,
    slideIndexOf,
    componentsOf,
    peersOf,
    fetchAllDecks,
    fetchDeck,
    insertNewDeck,
    deleteDeck,
    updateDeckTitle,
    fetchAllSlides,
    fetchSlides,
    insertNewSlides,
    insertingSlides,
    deleteSlides,
    reorderSlides,
    fetchAllNodes,
    fetchNodeComponents,
    createNode,
    updateNode,
    deleteNodes,
    deleteSelectedNodes,
    selectNodes,
    duplicateSelection,
    copySelection,
    cutSelection,
    paste,
    groupSelection,
    ungroupSelection,
    selectAll,
    reorderNodes,
    updateComponent,
    nextSlides,
    prevSlides,
  };
});
