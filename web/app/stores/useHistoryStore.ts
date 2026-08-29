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

  const EMPTY_SLIDE: SlideState = { nodes: [], components: [] };

  // Currently it clones whole slides per edit, may cause performance issues in future.
  function readSlide(slideId: string): SlideState | null {
    const deck = useDeckStore();
    const tree = deck.trees.get(slideId);

    if (!tree?.id) return null;

    return {
      nodes: stripTree(flattenTree(tree)),
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

    const tree = focus.slideId ? deck.trees.get(focus.slideId) : undefined;

    if (!tree?.id) return;

    const live = new Set(flattenTree(tree).map((n) => n.id));

    deck.selectedNodeIds = focus.selection.filter((id) => live.has(id));
    deck.anchorId = deck.selectedNodeIds.at(-1) ?? null;
  }

  function applySlides(states: Captured) {
    const deck = useDeckStore();

    for (const slideId of states.keys())
      if (!deck.slides.some((s) => s.id === slideId))
        throw new HistoryUnreachable("The slide no longer exists");

    const sync = useDeckSync();

    for (const [slideId, target] of states) {
      const ops = diffSlideState(readSlide(slideId) ?? EMPTY_SLIDE, target);

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

  function capture(slideId: string, mergeKey?: string) {
    if (replaying.value) return;
    if (open?.before.has(slideId)) return;

    const before = readSlide(slideId);

    if (!before) return;

    if (!open) {
      open = { label: "Edit", mergeKey, before: new Map(), focus: readFocus() };
      autoClose = setTimeout(() => commit(), 0);
    }

    open.before.set(slideId, before);
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
      after.set(slideId, readSlide(slideId) ?? EMPTY_SLIDE);

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
    transact,
    begin,
    undo,
    redo,
    clear,
  };
});
