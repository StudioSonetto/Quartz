const LIMIT = 50;

export const useHistoryStore = defineStore("history", () => {
  const undoStack = ref<HistoryEntry[]>([]);
  const redoStack = ref<HistoryEntry[]>([]);

  const replaying = ref(false);

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  let queue: Promise<void> = Promise.resolve();

  type Captured = Map<string, SlideState>;
  type Focus = { slideId: string | null; selection: string[] };

  let open: {
    label: string;
    mergeKey?: string;
    before: Captured;
    focus: Focus;
  } | null = null;
  let autoClose: ReturnType<typeof setTimeout> | null = null;

  const remaps = new Map<string, string>();

  function remapNode(from: string, to: string) {
    const live = resolveId(from);

    if (live === to) return;

    remaps.set(live, to);
  }

  function resolveId(id: string): string {
    let out = id;

    for (let i = 0; i < remaps.size && remaps.has(out); i++)
      out = remaps.get(out)!;

    return out;
  }

  function readSlide(slideId: string): SlideState {
    const deck = useDeckStore();
    const tree = deck.trees.get(slideId);

    return {
      nodes: tree?.id ? stripTree(flattenTree(tree)) : [],
      components: JSON.parse(
        JSON.stringify(deck.components.get(slideId) ?? []),
      ),
    };
  }

  function readFocus(): Focus {
    const deck = useDeckStore();

    return {
      slideId: deck.currentSlides?.id ?? null,
      selection: [...deck.selectedNodeIds],
    };
  }

  function applyFocus(focus: Focus) {
    const deck = useDeckStore();

    if (focus.slideId && deck.slides.some((s) => s.id === focus.slideId))
      deck.currentSlideId = focus.slideId;

    // A slide the background load has not reached yet has no tree, and
    // filtering against nothing would silently deselect everything.
    const tree = focus.slideId ? deck.trees.get(focus.slideId) : undefined;

    if (!tree?.id) return;

    // One flatten for the whole selection; getNodeById would rescan every
    // loaded slide per id.
    const live = new Set(flattenTree(tree).map((n) => n.id));

    deck.selectedNodeIds = focus.selection.filter((id) => live.has(id));
    deck.anchorId = deck.selectedNodeIds.at(-1) ?? null;
  }

  function applySlides(states: Captured) {
    const deck = useDeckStore();

    // Check every slide before touching any: a slide another client deleted is
    // gone for good, and throwing part-way would leave the entry half-applied.
    for (const slideId of states.keys())
      if (!deck.slides.some((s) => s.id === slideId))
        throw new HistoryUnreachable("The slide no longer exists");

    const sync = useDeckSync();

    for (const [slideId, snapshot] of states) {
      // Ids are only ever remapped by a slide restore, so skip the two scans
      // remapSlideState would otherwise make on every step.
      const target = remaps.size
        ? remapSlideState(snapshot, resolveId)
        : snapshot;
      const ops = diffSlideState(readSlide(slideId), target);

      deck.trees.set(slideId, buildTree(target.nodes));
      deck.components.set(
        slideId,
        JSON.parse(JSON.stringify(target.components)),
      );

      for (const id of ops.nodes) sync.enqueueNode(id);
      for (const { id, ...del } of ops.deletes) sync.enqueueDelete(del, id);
      for (const c of ops.components) sync.enqueueComponent(c.node, c.type);
      for (const c of ops.componentDeletes)
        sync.enqueueComponentDelete(c.node, c.type);
    }
  }

  function captureCurrent(mergeKey?: string) {
    const slideId = useDeckStore().currentSlides?.id;

    if (slideId) capture(slideId, mergeKey);
  }

  // mergeKey coalesces a burst of identical edits into one entry. Only set when
  // this call opens the transaction: an edit already in progress owns the key.
  function capture(slideId: string, mergeKey?: string) {
    if (replaying.value) return;

    if (!open) {
      open = { label: "Edit", mergeKey, before: new Map(), focus: readFocus() };
      autoClose = setTimeout(() => commit(), 0);
    }

    if (!open.before.has(slideId)) open.before.set(slideId, readSlide(slideId));
  }

  function commit() {
    if (autoClose) clearTimeout(autoClose);
    autoClose = null;
    depth = 0;

    const pending = open;
    open = null;

    if (!pending || !pending.before.size) return;

    const after: Captured = new Map();
    for (const slideId of pending.before.keys())
      after.set(slideId, readSlide(slideId));

    const changed = [...pending.before].some(([slideId, before]) => {
      const ops = diffSlideState(before, after.get(slideId)!);
      return (
        ops.nodes.length ||
        ops.deletes.length ||
        ops.components.length ||
        ops.componentDeletes.length
      );
    });

    if (!changed) return;

    const focusAfter = readFocus();

    record({
      label: pending.label,
      mergeKey: pending.mergeKey,
      undo: () => {
        applySlides(pending.before);
        applyFocus(pending.focus);
      },
      redo: () => {
        applySlides(after);
        applyFocus(focusAfter);
      },
    });
  }

  function transact<T>(
    label: string,
    fn: () => T,
    opts: { mergeKey?: string } = {},
  ): T {
    if (open) return fn();

    open = {
      label,
      mergeKey: opts.mergeKey,
      before: new Map(),
      focus: readFocus(),
    };
    captureCurrent();

    try {
      return fn();
    } finally {
      commit();
    }
  }

  // A gesture started during a slower one (a drag while an upload is still
  // running) must not commit the outer transaction when it ends.
  let depth = 0;

  function begin(label: string): () => void {
    if (!open) open = { label, before: new Map(), focus: readFocus() };
    else if (!depth) open.label = label;

    if (autoClose) clearTimeout(autoClose);
    autoClose = null;

    depth++;
    captureCurrent();

    let done = false;

    return () => {
      if (done) return;
      done = true;

      depth = Math.max(0, depth - 1);

      if (depth) return;

      commit();
    };
  }

  function record(entry: Omit<HistoryEntry, "at">) {
    const now = Date.now();
    const top = undoStack.value[undoStack.value.length - 1];
    const merged = top ? mergeInto(top, entry, now) : null;

    if (merged) undoStack.value[undoStack.value.length - 1] = merged;
    else {
      undoStack.value.push({ ...entry, at: now });
      if (undoStack.value.length > LIMIT) undoStack.value.shift();
    }

    redoStack.value = [];
  }

  // Sampled when an operation starts, not when it finishes: a replay beginning
  // mid-flight would otherwise swallow the entry. The only way to record, so an
  // async producer cannot get this wrong by reaching for a simpler call.
  function pushLater() {
    const wasReplaying = replaying.value;

    return (entry: Omit<HistoryEntry, "at">) => {
      if (!wasReplaying) record(entry);
    };
  }

  function enqueue(run: () => Promise<void>): Promise<void> {
    queue = queue.then(run, run);
    return queue;
  }

  async function step(
    from: Ref<HistoryEntry[]>,
    to: Ref<HistoryEntry[]>,
    dir: "undo" | "redo",
  ) {
    replaying.value = true;

    try {
      for (;;) {
        const entry = from.value.pop();
        if (!entry) return;

        try {
          await entry[dir]();
          to.value.push(entry);
          return;
        } catch (error) {
          console.error(`History ${dir} failed:`, error);

          // An unreachable entry is dropped, but the keypress should still do
          // something: fall through to the next one.
          if (error instanceof HistoryUnreachable) continue;

          from.value.push(entry);
          return;
        }
      }
    } finally {
      replaying.value = false;
    }
  }

  const undo = () => enqueue(() => step(undoStack, redoStack, "undo"));
  const redo = () => enqueue(() => step(redoStack, undoStack, "redo"));

  function clear() {
    undoStack.value = [];
    redoStack.value = [];
    remaps.clear();
  }

  return {
    canUndo,
    canRedo,
    replaying,
    pushLater,
    capture,
    captureCurrent,
    readSlide,
    applySlides,
    remapNode,
    transact,
    begin,
    undo,
    redo,
    clear,
  };
});
