const LIMIT = 50;

export const useHistoryStore = defineStore("history", () => {
  const undoStack = ref<HistoryEntry[]>([]);
  const redoStack = ref<HistoryEntry[]>([]);

  const replaying = ref(false);

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  let queue: Promise<void> = Promise.resolve();

  type Captured = Map<string, SlideState>;

  let open: { label: string; mergeKey?: string; before: Captured } | null =
    null;
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
      nodes: tree?.id
        ? flattenTree(tree).map(({ children, parent, ...n }) => n)
        : [],
      components: JSON.parse(
        JSON.stringify(deck.components.get(slideId) ?? []),
      ),
    };
  }

  function applySlide(slideId: string, snapshot: SlideState) {
    const deck = useDeckStore();
    const sync = useDeckSync();
    const target = remapSlideState(snapshot, resolveId);
    const ops = diffSlideState(readSlide(slideId), target);

    deck.trees.set(slideId, buildTree(target.nodes));
    deck.components.set(slideId, JSON.parse(JSON.stringify(target.components)));

    for (const id of ops.nodes) sync.enqueueNode(id);
    for (const { id, ...del } of ops.deletes) sync.enqueueDelete(del, id);
    for (const c of ops.components) sync.enqueueComponent(c.node, c.type);
    for (const c of ops.componentDeletes)
      sync.enqueueComponentDelete(c.node, c.type);
  }

  function captureCurrent() {
    const slideId = useDeckStore().currentSlides?.id;

    if (slideId) capture(slideId);
  }

  function capture(slideId: string) {
    if (replaying.value) return;

    if (!open) {
      open = { label: "Edit", before: new Map() };
      autoClose = setTimeout(() => commit(), 0);
    }

    if (!open.before.has(slideId)) open.before.set(slideId, readSlide(slideId));
  }

  function commit() {
    if (autoClose) clearTimeout(autoClose);
    autoClose = null;

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

    push({
      label: pending.label,
      mergeKey: pending.mergeKey,
      undo: () => {
        for (const [slideId, state] of pending.before)
          applySlide(slideId, state);
      },
      redo: () => {
        for (const [slideId, state] of after) applySlide(slideId, state);
      },
    });
  }

  function transact<T>(
    label: string,
    fn: () => T,
    opts: { mergeKey?: string } = {},
  ): T {
    if (open) return fn();

    open = { label, mergeKey: opts.mergeKey, before: new Map() };
    captureCurrent();

    try {
      return fn();
    } finally {
      commit();
    }
  }

  function begin(label: string): () => void {
    if (!open) open = { label, before: new Map() };
    else open.label = label;

    if (autoClose) clearTimeout(autoClose);
    autoClose = null;

    captureCurrent();

    let done = false;

    return () => {
      if (done) return;
      done = true;
      commit();
    };
  }

  function push(entry: Omit<HistoryEntry, "at">) {
    if (replaying.value) return;

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

  function enqueue(run: () => Promise<void>): Promise<void> {
    queue = queue.then(run, run);
    return queue;
  }

  async function step(
    from: Ref<HistoryEntry[]>,
    to: Ref<HistoryEntry[]>,
    dir: "undo" | "redo",
  ) {
    const entry = from.value.pop();
    if (!entry) return;

    replaying.value = true;

    try {
      await entry[dir]();
      to.value.push(entry);
    } catch (error) {
      if (!(error instanceof HistoryUnreachable)) from.value.push(entry);

      console.error(`History ${dir} failed:`, error);
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
    push,
    capture,
    applySlide,
    remapNode,
    transact,
    begin,
    undo,
    redo,
    clear,
  };
});
