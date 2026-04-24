// TODO: Refactor this whole mess.

export const useDeckStore = defineStore("deck", () => {
  const client = useSupabaseClient<Database>();

  const slides = ref<SlidesModel[]>([]);
  const currentSlides = computed(() => slides.value[currentSlidesIndex.value]);

  const trees = ref<Tree[]>([EMPTY_TREE]);
  const currentTree = computed(() => trees.value[currentSlidesIndex.value]);

  const components = ref<ComponentModel[][]>([]);
  const currentComponents = computed(
    () => components.value[currentSlidesIndex.value],
  );

  const currentSlidesIndex = ref<number>(0);
  const selectedNode = ref<Tree | null>(null);
  const slidesInLoading = ref<Set<number>>(new Set());

  const pendingChanges = ref<{
    nodes: PendingNode[];
    components: ComponentModel[];
  }>({
    nodes: [],
    components: [],
  });

  watch(slides, (newSlides) => {
    if (trees.value.length >= newSlides.length) return;

    // Initialise data for new slides.
    trees.value.push(EMPTY_TREE);
    components.value.push([]);
  });

  watch(currentSlides, async () => {
    if (
      !pendingChanges.value.nodes.length ||
      !pendingChanges.value.components.length
    )
      return;

    // Upsert pending changes if any.
    await saveChanges();
  });

  watch(currentTree, async () => {
    if (
      currentTree.value?.id ||
      slidesInLoading.value.has(currentSlidesIndex.value)
    )
      return;

    // Fetch nodes for the current slides, then load the rest in parallel.
    await fetchAllNodes(currentSlidesIndex.value);
    await parallelLoad();
  });

  watch(currentSlidesIndex, async () => {
    // Reset the selected node.
    selectedNode.value = null;
  });

  watch(
    () => pendingChanges.value.nodes,
    async (pendingNodes) => {
      if (!pendingNodes.length) return;

      trees.value[currentSlidesIndex.value] = buildTree([
        ...(currentTree.value ? flattenTree(currentTree.value) : []),
        ...pendingNodes,
      ]);
    },
    { deep: true },
  );

  // Autosave nodes and components.
  watchDebounced(
    pendingChanges,
    async (changes) => {
      if (!changes.nodes.length && !changes.components.length) return;

      await saveChanges();
    },
    { debounce: 5000, deep: true },
  );

  async function fetchAllDecks() {
    const { data, error } = await client
      .from("decks")
      .select("*")
      .match({ lapidarist: useAuthStore().user?.id })
      .order("last_modified", { ascending: true });

    if (error) throw error;

    return data;
  }

  async function fetchDeck(id: string) {
    const { data, error } = await client
      .from("decks")
      .select("*")
      .match({ lapidarist: useAuthStore().user?.id })
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  async function insertNewDeck() {
    const { data, error } = await client
      .from("decks")
      .insert({
        lapidarist: `${useAuthStore().user?.id}`,
        title: "Unnamed Deck",
      })
      .select()
      .single();

    if (error) throw error;

    navigateTo(`/atelier/${data?.id}`, {
      external: true,
      open: {
        target: "_blank",
      },
    });
  }

  async function updateDeckTitle(value: string) {
    if (!value.length) return;

    await client
      .from("decks")
      .update({ title: value })
      .eq("id", useRoute().params.id as string);
  }

  async function deleteDeck(id: string) {
    const { data, error } = await client.from("decks").delete().eq("id", id);

    if (error) throw error;

    return data;
  }

  async function fetchAllSlides(deck: string) {
    const { data, error } = await client
      .from("slides")
      .select("*")
      .eq("deck", deck)
      .order("index", { ascending: true });

    if (error) throw error;

    if (data) slides.value = data;

    return data;
  }

  async function fetchSlides(deck: string, index: number) {
    const { data, error } = await client
      .from("slides")
      .select("*")
      .eq("deck", deck)
      .eq("index", index)
      .single();

    if (error) throw error;

    return data;
  }

  async function insertNewSlides(deck: string) {
    const { data, error } = await client
      .from("slides")
      .insert({
        deck: deck,
        index: slides.value.length,
      })
      .select();

    if (error) throw error;

    return data;
  }

  async function fetchAllNodes(
    index: number = currentSlidesIndex.value,
    deck?: string,
  ) {
    const id = deck
      ? (await fetchSlides(deck, index))?.id
      : slides.value?.[index]?.id;

    if (!id) return [];

    const { data, error } = await client
      .from("nodes")
      .select("*")
      .eq("slides", id)
      .order("path", { ascending: true });

    if (error) throw error;

    if (data) {
      const fetchedComponents = await Promise.all(
        data.map((node) => fetchNodeComponents(node.id)),
      );

      components.value[index] = fetchedComponents.flat();

      trees.value[index] = buildTree(data);

      return trees.value[index].children;
    }

    return [];
  }

  async function insertNewNode(slides: string, name: string, type: NodeType) {
    const { data: id, error } = await client.rpc("generate_uuid");

    if (error) throw error;

    const path = selectedNode.value
      ? `${selectedNode.value?.path}.${name}`
      : `root.${name}`;

    // Add node to pending changes.
    const node: PendingNode = {
      id: id,
      slides: slides,
      name: name,
      path: path,
      type: type,
      reference: "",
    };

    // TODO: Move this to a separate function.
    // Create default components
    const defaultComponents: ComponentModel[] = [
      {
        type: "base",
        node: id,
        data: {},
      },
      {
        type: "transform",
        node: id,
        data: {
          position: {
            x: 0,
            y: 0,
            z: 0,
          },
          scale: 1,
        },
      },
    ];

    switch (type) {
      case "group":
        defaultComponents.push({
          type: "layout",
          node: id,
          data: {},
        });

        break;

      case "text":
        defaultComponents.push({
          type: "typography",
          node: id,
          data: {
            alignment: "left",
            colour: "#151515",
            content: "New Text",
            font: "Azeret Mono",
            size: 30,
            style: [],
            weight: 300,
          },
        });

        break;

      case "webgl_canvas":
        defaultComponents.push({
          type: "scene",
          node: id,
          data: {
            background: "#151515",
          },
        });

        defaultComponents.push({
          type: "camera",
          node: id,
          data: {
            x: 0,
            y: 0,
            z: 5,
          },
        });

        break;

      case "webgl_object":
        defaultComponents.push({
          type: "mesh",
          node: id,
          data: {
            type: "box",
            fallback: "none",
            colour: "#FAFAFA",
            texture: "default",
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
          },
        });

        break;
    }

    pendingChanges.value.nodes.push(node);

    pendingChanges.value.components.push(...defaultComponents);

    components.value[currentSlidesIndex.value]!.push(...defaultComponents);

    selectedNode.value = node as Tree;
  }

  async function deleteSelectedNode() {
    if (!selectedNode.value || selectedNode.value.path === "root") return;

    pendingChanges.value.nodes.push({
      ...selectedNode.value,
      _deleted: true,
    });

    selectedNode.value = null;
  }

  function updateNode(tree: Tree) {
    const { children, ...node } = tree;

    const index = pendingChanges.value.nodes.findIndex(
      (pending) => pending.id === node.id,
    );

    if (index !== -1) {
      pendingChanges.value.nodes.splice(index, 1);
    }

    pendingChanges.value.nodes.push(node);
  }

  async function fetchNodeComponents(node: string) {
    const { data, error } = await client
      .from("components")
      .select("*")
      .eq("node", node)
      .order("type", { ascending: true });

    if (error) throw error;

    return data;
  }

  async function updateNodeComponent(component: ComponentModel) {
    const index = pendingChanges.value.components.findIndex(
      (c) => c.node === component.node && c.type === component.type,
    );

    if (index !== -1) {
      pendingChanges.value.components[index] = component;
    } else {
      pendingChanges.value.components.push(component);
    }
  }

  function buildTree(nodes: NodeModel[] | PendingNode[]): Tree {
    const lookup: Record<string, Tree> = {};

    // Process existing nodes.
    nodes.forEach((node) => {
      lookup[node.path] = {
        ...node,
        children: [],
      };
    });

    // Process pending nodes.
    pendingChanges.value.nodes.forEach((node: PendingNode) => {
      if (!node._deleted) {
        lookup[node.path] = {
          ...node,
          children: [],
        };
      } else {
        delete lookup[node.path];
      }
    });

    Object.values(lookup).forEach((node) => {
      const parentPath = node.path.split(".").slice(0, -1).join(".");
      const parentNode = lookup[parentPath];

      if (parentNode) {
        node.parent = parentNode;

        parentNode.children.push(node);
      }
    });

    return lookup["root"] || EMPTY_TREE;
  }

  // TODO: Too complex, find a better way to do this.
  async function saveChanges() {
    if (!currentSlides.value) return;

    const nodesToUpsert = pendingChanges.value.nodes.filter(
      (node) => node.id && !node._deleted,
    );
    const nodesToInsert = pendingChanges.value.nodes.filter(
      (node) => !node.id && !node._deleted,
    );
    const nodesToDelete = pendingChanges.value.nodes.filter(
      (node) => node._deleted,
    );

    // Node insert.
    if (nodesToInsert.length) {
      const { error } = await client
        .from("nodes")
        // Remove the id and _deleted fields.
        .insert(nodesToInsert.map(({ id, _deleted, ...node }) => node))
        .select();

      if (error) throw error;
    }

    // Node update.
    if (nodesToUpsert.length) {
      const { error } = await client.from("nodes").upsert(nodesToUpsert, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

      if (error) throw error;
    }

    // Node delete.
    if (nodesToDelete.length) {
      for (const node of nodesToDelete) {
        if (node._pending) return;

        const { error } = await client.rpc("delete_node_and_children", {
          node_path: node.path,
          slides_id: node.slides,
        });

        if (error) throw error;
      }
    }

    // Component upsert.
    if (pendingChanges.value.components.length) {
      const validNodes = new Set(
        (trees.value[currentSlidesIndex.value]
          ? flattenTree(trees.value[currentSlidesIndex.value]!)
          : []
        ).map((node) => node.id),
      );

      // Filter nodes that still exists.
      const componentsToUpsert = pendingChanges.value.components.filter(
        (component) => validNodes.has(component.node),
      );

      const { error } = await client
        .from("components")
        .upsert(componentsToUpsert, {
          onConflict: "node, type",
          ignoreDuplicates: false,
        });

      if (error) throw error;
    }

    await useSnapshot().capture();
    await useSnapshot().fetch(currentSlides.value.deck, currentSlides.value.id);

    pendingChanges.value = {
      nodes: [],
      components: [],
    };
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

    // Load all in parallel.
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

  const flattenTree = (tree: Tree): NodeModel[] => [
    tree,
    ...tree.children.flatMap(flattenTree),
  ];

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
    fetchAllDecks,
    fetchDeck,
    insertNewDeck,
    deleteDeck,
    updateDeckTitle,
    fetchAllSlides,
    fetchSlides,
    insertNewSlides,
    fetchAllNodes,
    insertNewNode,
    deleteSelectedNode,
    fetchNodeComponents,
    updateNode,
    updateNodeComponent,
    nextSlides,
    prevSlides,
  };
});
