const TODAY = new Date().toISOString().slice(0, 10);

export const useDeckStore = defineStore("deck", () => {
  const apiFetch = useRequestFetch();
  const sync = useDeckSync();
  const history = useHistoryStore();

  const slides = ref<SlidesModel[]>([]);

  const deckTitle = ref("");

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

  function setSlideNodes(slideId: string, models: NodeModel[]) {
    history.capture(slideId);
    trees.value.set(slideId, buildTree(models));
  }

  function setSlideComponents(slideId: string, list: ComponentModel[]) {
    history.capture(slideId);
    components.value.set(slideId, list);
  }

  function forgetSlide(id: string) {
    const tree = trees.value.get(id);

    if (tree?.id) for (const node of flattenTree(tree)) releaseNode(node);

    trees.value.delete(id);
    components.value.delete(id);
    slidesInLoading.value.delete(id);
  }

  function releaseNode(node: Tree) {
    getNodeType(node.type)?.onDelete?.(node.id);
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

  const variablesByNode = computed(() => {
    const map = new Map<string, VariableDef[]>();

    for (const component of currentComponents.value ?? []) {
      if (component.type !== "core.base") continue;

      const list = component.data?.variables;

      if (Array.isArray(list) && list.length) map.set(component.node, list);
    }

    return map;
  });

  const builtins = computed<Record<BuiltinName, Value>>(() => ({
    "slides.index": currentSlidesIndex.value,
    "slides.count": slides.value.length,
    "deck.title": deckTitle.value,
    date: TODAY,
  }));

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

  const unlockedSelection = computed<Tree[]>(() =>
    unlockedOnly(selectedNodes.value),
  );

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

      if (!history.replaying) {
        selectedNodeIds.value = [];
        anchorId.value = null;
      }

      useAnimationState().reset();

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
    channel: SyncChannel | null = null,
    located: { node: Tree; slideIndex: number } | null = locateNode(id),
  ): { node: Tree; slideIndex: number }[] {
    if (!located) return [];

    const { reference: key, type } = located.node;
    if (!key || (channel && !syncs(located.node, channel))) return [];

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
    const deck = await apiFetch<DeckModel>(`/api/decks/${id}`);

    deckTitle.value = deck?.title ?? "";

    return deck;
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
    const previous = deckTitle.value;

    if (previous === title) return;

    const id = useRoute().params.id?.toString() ?? "";
    const record = history.pushLater();

    await writeDeckTitle(id, title);

    record({
      label: "Rename Deck",
      mergeKey: "deck:title",
      undo: () => writeDeckTitle(id, previous),
      redo: () => writeDeckTitle(id, title),
    });
  }

  async function writeDeckTitle(id: string, title: string) {
    await apiFetch(`/api/decks/${id}`, {
      method: "PATCH",
      body: { title },
    });

    deckTitle.value = title;
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

  type CreatedSlide = SlidesModel & { root?: string };

  async function insertNewSlides(deck: string, id?: string) {
    if (insertingSlides.value) return;

    insertingSlides.value = true;

    const record = history.pushLater();

    try {
      const slide = await apiFetch<CreatedSlide>("/api/slides", {
        method: "POST",
        body: { deck, index: slides.value.length, ...(id ? { id } : {}) },
      });

      if (slide) {
        if (!slides.value.some((s) => s.id === slide.id))
          slides.value = [...slides.value, slide];

        record({
          label: "Add Slide",
          undo: async () => {
            if (slides.value.length <= 1)
              throw new HistoryUnreachable(
                "Add Slide undo cannot remove the only slide",
              );

            if (!(await deleteSlides(slide.id)))
              throw new Error("Add Slide undo did not remove the slide");
          },
          redo: async () => {
            const again = await insertNewSlides(deck, slide.id);

            if (!again)
              throw new Error("Add Slide redo did not create the slide");

            if (!slide.root || !again.root)
              throw new Error("Add Slide redo could not resolve the new root");

            history.remapNode(slide.root, again.root);

            await fetchAllNodes(
              slides.value.findIndex((s) => s.id === again.id),
            );
          },
        });
      }

      return slide;
    } finally {
      insertingSlides.value = false;
    }
  }

  async function deleteSlides(id: string): Promise<boolean> {
    const index = slides.value.findIndex((s) => s.id === id);

    if (index === -1) return true;

    if (slides.value.length <= 1) return false;

    const deck = slides.value[index]!.deck;
    const previousSlideId = currentSlideId.value;
    const record = history.pushLater();

    if (!trees.value.get(id)?.id) await fetchAllNodes(index).catch(() => {});

    const loaded = history.readSlide(id);

    // No snapshot means no undo: restoring from a slide we never read would
    // bring it back empty.
    const snapshot: SlideSnapshot | null = loaded && {
      deck,
      order: slides.value.map((s) => s.id),
      ...loaded,
    };

    for (const n of snapshot?.nodes ?? []) sync.dropNode(n.id);

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

      if (snapshot)
        record({
          label: "Delete Slide",
          undo: () => restoreSlide(id, snapshot),
          redo: async () => {
            if (slides.value.length <= 1)
              throw new HistoryUnreachable(
                "Delete Slide redo cannot remove the only slide",
              );

            if (!(await deleteSlides(id)))
              throw new Error("Delete Slide redo did not remove the slide");
          },
        });

      return true;
    } catch {
      currentSlideId.value = previousSlideId;

      await fetchAllSlides(deck).catch(() => {});
      await parallelLoad().catch(() => {});

      return false;
    }
  }

  type SlideSnapshot = SlideState & { deck: string; order: string[] };

  async function restoreSlide(id: string, snap: SlideSnapshot) {
    const slide = await insertNewSlides(snap.deck, id);

    if (!slide) throw new Error("Could not restore the slide yet; try again");

    const oldRoot = snap.nodes.find((n) => n.path === ROOT_PATH);

    if (!oldRoot || !slide.root)
      throw new Error("Could not resolve the restored slide's root");

    history.remapNode(oldRoot.id, slide.root);

    history.applySlides(new Map([[id, snap]]));

    await sync.flush();
    await applySlideOrder(snap.order);

    currentSlideId.value = id;
  }

  const reorderingSlides = ref(false);
  let resaveWanted = false;
  let replayResave = false;
  let earliestOrder: string[] | undefined;
  let inFlightReorder: Promise<void> | null = null;

  function reorderSlides(previousOrder?: string[]): Promise<void> {
    const deck = slides.value[0]?.deck;

    if (!deck) return Promise.resolve();

    slides.value = slides.value.map((s, i) => ({ ...s, index: i }));

    if (reorderingSlides.value) {
      resaveWanted = true;

      if (previousOrder) earliestOrder ??= previousOrder;
      else replayResave = true;

      return inFlightReorder ?? Promise.resolve();
    }

    earliestOrder = previousOrder;
    replayResave = false;
    inFlightReorder = runReorder(deck).finally(() => {
      inFlightReorder = null;
    });

    return inFlightReorder;
  }

  async function runReorder(deck: string) {
    reorderingSlides.value = true;

    const record = history.pushLater();

    let submitted: string[] = [];

    try {
      do {
        resaveWanted = false;
        submitted = slides.value.map((s) => s.id);

        await apiFetch(`/api/decks/${deck}/slides`, {
          method: "PATCH",
          body: { order: submitted },
        });
      } while (resaveWanted);

      const previous = earliestOrder;

      if (previous && !replayResave && submitted.join() !== previous.join())
        record({
          label: "Reorder Slides",
          undo: () => applySlideOrder(previous),
          redo: () => applySlideOrder(submitted),
        });
    } catch (err) {
      await fetchAllSlides(deck).catch(() => {});

      throw err;
    } finally {
      reorderingSlides.value = false;
      earliestOrder = undefined;
      replayResave = false;
    }
  }

  async function applySlideOrder(order: string[]) {
    const byId = new Map(slides.value.map((s) => [s.id, s]));
    const known = new Set(order);

    slides.value = [
      ...order.map((id) => byId.get(id)).filter((s): s is SlidesModel => !!s),
      ...slides.value.filter((s) => !known.has(s.id)),
    ];

    await reorderSlides();
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

  function nextSiblingOrder(parentPath: string): number {
    const siblings = currentFlat().filter(
      (n) => n.path.split(".").slice(0, -1).join(".") === parentPath,
    );
    return siblings.reduce((max, n) => Math.max(max, n.sort_order), -1) + 1;
  }

  function flatModels(): NodeModel[] {
    return stripTree(currentFlat());
  }

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
      unsynced: null,
      locked: false,
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

    setSlideNodes(slideId, [...flatModels(), node]);
    const slideComponents = components.value.get(slideId) ?? [];
    slideComponents.push(...defaultComponents);
    setSlideComponents(slideId, slideComponents);

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
    patch: Partial<
      Pick<NodeModel, "name" | "reference" | "unsynced" | "locked">
    >,
  ) {
    const target = getNodeAsTree(id);

    if (!target) return;

    history.capture(target.slides);

    Object.assign(target, patch);

    sync.enqueueNode(id);

    if (patch.reference !== undefined) return;

    if (patch.unsynced !== undefined) {
      for (const { node } of peersOf(id)) {
        history.capture(node.slides);
        node.unsynced = patch.unsynced ? [...patch.unsynced] : null;
        sync.enqueueNode(node.id);
      }
      return;
    }

    if (patch.name === undefined) return;

    for (const { node } of peersOf(id, "name")) {
      history.capture(node.slides);
      node.name = patch.name;
      sync.enqueueNode(node.id);
    }
  }

  function deleteNodes(nodes: Tree[]) {
    if (!nodes.length) return;

    let roots = outermostNodes(nodes.filter((n) => n.path !== ROOT_PATH));

    if (!roots.length) return;

    const slideId = currentSlides.value?.id;

    if (!slideId) return;

    roots = roots.filter((r) => r.slides === slideId);

    if (!roots.length) return;

    const slideComponents = components.value.get(slideId) ?? [];
    const flat = currentFlat();
    const removed = flat.filter((n) =>
      roots.some((r) => isSelfOrDescendantPath(n.path, r.path)),
    );
    const removedIds = new Set(removed.map((n) => n.id));

    setSlideNodes(
      slideId,
      stripTree(flat.filter((n) => !removedIds.has(n.id))),
    );

    setSlideComponents(
      slideId,
      slideComponents.filter((c) => !removedIds.has(c.node)),
    );

    for (const n of removed) {
      sync.dropNode(n.id);
      releaseNode(n);
    }

    for (const r of roots)
      sync.enqueueDelete({ path: r.path, slides: r.slides }, r.id);

    selectedNodeIds.value = [];
    anchorId.value = null;
  }

  function deleteSelectedNodes() {
    deleteNodes(unlockedSelection.value);
  }

  function selectionRoots(nodes: Tree[] = unlockedSelection.value): Tree[] {
    return outermostNodes(nodes).filter((n) => n.path !== ROOT_PATH);
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
      unsynced: null,
      locked: false,
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
    setSlideNodes(slideId, nextFlat);

    // Group's default components (core.group ships transform + layout).
    const groupDefaults = buildDefaultComponents(id, "core.group");
    const slideComponents = components.value.get(slideId) ?? [];
    slideComponents.push(...groupDefaults);
    setSlideComponents(slideId, slideComponents);

    sync.enqueueNode(id);
    for (const c of groupDefaults) sync.enqueueComponent(c.node, c.type);

    for (const n of nextFlat) {
      if (n.path !== ROOT_PATH && n.id !== id) sync.enqueueNode(n.id);
    }
    selectedNodeIds.value = [id];
    anchorId.value = id;

    getNodeType("core.group")?.onCreate?.(id);
  }

  function ungroupSelection() {
    const groups = unlockedSelection.value.filter(
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

    setSlideNodes(slideId, flat);

    const groupIds = new Set(groups.map((g) => g.id));

    setSlideComponents(
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

    setSlideNodes(slidesId, [...flatModels(), ...rebased]);

    const slideComponents = components.value.get(slidesId) ?? [];

    slideComponents.push(...clone.components);

    setSlideComponents(slidesId, slideComponents);

    for (const n of rebased) sync.enqueueNode(n.id);
    for (const c of clone.components) sync.enqueueComponent(c.node, c.type);

    return root.id;
  }

  const CLONE_OFFSET = { x: 24, y: 24 };

  function duplicateSelection() {
    const roots = selectionRoots(selectedNodes.value);

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

  function copySelection(nodes: Tree[] = selectedNodes.value) {
    const roots = selectionRoots(nodes);

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
    copySelection(unlockedSelection.value);
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

    selectedNodeIds.value = unlockedOnly(flattenTree(tree))
      .filter((n) => n.path !== ROOT_PATH)
      .map((n) => n.id);
    anchorId.value = selectedNodeIds.value.at(-1) ?? null;
  }

  function reorderNodes() {
    const slideId = currentSlides.value?.id;
    const root = currentTree.value;

    if (!root || !slideId) return;

    history.capture(slideId);

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
    setSlideNodes(slideId, stripTree(flattenTree(root)));

    for (const id of changed) sync.enqueueNode(id);
  }

  function writeComponentAt(slideIndex: number, component: ComponentModel) {
    const slideComponents = componentsAt(slideIndex);
    if (!slideComponents) return;

    const slideId = slides.value[slideIndex]?.id;

    // Rapid writes to one component coalesce: typing 240 into a width box is
    // one entry, not three. A gesture has already opened its own transaction,
    // so this key is ignored during a drag.
    if (slideId)
      history.capture(slideId, `component:${component.node}:${component.type}`);

    const index = slideComponents.findIndex(
      (c) => c.node === component.node && c.type === component.type,
    );
    if (index !== -1) slideComponents[index] = component;
    else slideComponents.push(component);

    sync.enqueueComponent(component.node, component.type);
  }

  function updateComponent(
    component: ComponentModel,
    located = locateNode(component.node),
  ) {
    if (isNodeLocked(located?.node)) return;

    const state = isStateless(component.type)
      ? BASE_STATE
      : useAnimationState().activeState(component.node);

    const anim = state ? getComponent(component.node, "core.animation") : null;

    if (anim && overridesFor(anim.data, state, component.type)) {
      return updateComponent(
        {
          ...anim,
          data: setNested(
            anim.data,
            ["states", state, "overrides", component.type],
            component.data,
          ),
        },
        located,
      );
    }

    writeComponentAt(
      located?.slideIndex ?? currentSlidesIndex.value,
      component,
    );

    for (const { slideIndex, node } of peersOf(
      component.node,
      component.type,
      located,
    )) {
      writeComponentAt(slideIndex, {
        ...component,
        node: node.id,
        data: JSON.parse(JSON.stringify(component.data)),
      });
    }
  }

  function addComponent(nodeId: string, type: ComponentType) {
    const located = locateNode(nodeId);
    if (!located) return;

    const present = componentsAt(located.slideIndex)?.some(
      (c) => c.node === nodeId && c.type === type,
    );
    if (present) return;

    updateComponent({
      node: nodeId,
      type,
      data: effectiveDefaults(located.node.type, type),
    } as ComponentModel);
  }

  function removeComponentAt(
    slideIndex: number,
    nodeId: string,
    type: ComponentType,
  ) {
    const slideComponents = componentsAt(slideIndex);
    if (!slideComponents) return;

    const slideId = slides.value[slideIndex]?.id;
    if (slideId) history.capture(slideId);

    const index = slideComponents.findIndex(
      (c) => c.node === nodeId && c.type === type,
    );
    if (index !== -1) slideComponents.splice(index, 1);

    sync.enqueueComponentDelete(nodeId, type);
  }

  function removeComponent(nodeId: string, type: ComponentType) {
    const located = locateNode(nodeId);
    if (!located || isGuaranteed(located.node.type, type)) return;
    if (isNodeLocked(located.node)) return;

    removeComponentAt(located.slideIndex, nodeId, type);

    for (const { slideIndex, node } of peersOf(nodeId, type, located)) {
      removeComponentAt(slideIndex, node.id, type);
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
    deckTitle,
    currentSlideId,
    currentSlides,
    currentSlidesIndex,
    trees,
    currentTree,
    components,
    currentComponents,
    variablesByNode,
    builtins,
    selectedNodeIds,
    anchorId,
    clipboard,
    selectedNodes,
    unlockedSelection,
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
    applySlideOrder,
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
    addComponent,
    removeComponent,
    nextSlides,
    prevSlides,
  };
});
