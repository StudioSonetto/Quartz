import type { FetchError } from "ofetch";

export const useDeckSync = defineStore("deck-sync", () => {
  const apiFetch = useRequestFetch();

  const dirtyNodes = ref<Set<string>>(new Set());
  const deletedNodes = ref<DeleteNode[]>([]);
  const dirtyComponents = ref<Set<string>>(new Set());
  const deletedComponents = ref<Set<string>>(new Set());

  const status = ref<SaveStatus>("idle");
  const flushing = ref(false);

  let backoff = 0;

  const hasPending = computed(
    () =>
      dirtyNodes.value.size > 0 ||
      deletedNodes.value.length > 0 ||
      dirtyComponents.value.size > 0 ||
      deletedComponents.value.size > 0,
  );

  function enqueueNode(id: string) {
    dirtyNodes.value.add(id);

    scheduleFlush();
  }

  function enqueueComponent(node: string, type: string) {
    const key = componentKey(node, type);

    deletedComponents.value.delete(key);
    dirtyComponents.value.add(key);

    scheduleFlush();
  }

  function enqueueComponentDelete(node: string, type: string) {
    const key = componentKey(node, type);

    dirtyComponents.value.delete(key);
    deletedComponents.value.add(key);

    scheduleFlush();
  }

  function dropNode(id: string) {
    dirtyNodes.value.delete(id);

    for (const key of [...dirtyComponents.value]) {
      if (key.startsWith(`${id}:`)) dirtyComponents.value.delete(key);
    }

    for (const key of [...deletedComponents.value]) {
      if (key.startsWith(`${id}:`)) deletedComponents.value.delete(key);
    }
  }

  function dropSlide(slideId: string) {
    deletedNodes.value = deletedNodes.value.filter((d) => d.slides !== slideId);
  }

  function enqueueDelete(del: DeleteNode, nodeId: string) {
    dropNode(nodeId);

    deletedNodes.value.push(del);

    scheduleFlush();
  }

  const debouncedFlush = useDebounceFn(() => flush(), 1500);

  function scheduleFlush() {
    debouncedFlush();
  }

  function currentSnapshot(): OutboxSnapshot {
    return {
      dirtyNodes: [...dirtyNodes.value],
      deletedNodes: [...deletedNodes.value],
      dirtyComponents: [...dirtyComponents.value],
      deletedComponents: [...deletedComponents.value],
    };
  }

  function buildPayloadFor(snapshot: OutboxSnapshot) {
    const store = useDeckStore();

    return buildSavePayload(
      snapshot,
      (id) => store.getNodeById(id),
      (key) => {
        const { node, type } = parseComponentKey(key);
        return store.getComponent(node, type);
      },
    );
  }

  async function flush(): Promise<void> {
    if (flushing.value || !hasPending.value) return;

    const snapshot = currentSnapshot();
    const payload = buildPayloadFor(snapshot);

    if (isEmptyPayload(payload)) {
      clearFlushed(snapshot);

      // Everything in the batch resolved to nothing — a deleted slide's
      // leftovers. Without this the chip stays on "saving" forever.
      status.value = hasPending.value ? "saving" : "saved";

      return;
    }

    clearFlushed(snapshot);

    flushing.value = true;
    status.value = "saving";

    try {
      await apiFetch("/api/nodes/save", { method: "POST", body: payload });

      backoff = 0;

      status.value = hasPending.value ? "saving" : "saved";

      if (hasPending.value) scheduleFlush();
    } catch (err) {
      const code =
        (err as FetchError)?.statusCode ??
        (err as FetchError)?.response?.status;

      // 401 is a session blip and a network error has no code; the rest of 4xx
      // can never succeed, and requeueing one wedges every later save behind it.
      const retryable = !code || code >= 500 || [401, 408, 429].includes(code);

      if (!retryable) {
        status.value = "error";

        if (hasPending.value) scheduleFlush();

        return;
      }

      restoreSnapshot(snapshot);

      status.value =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "offline"
          : "error";

      backoff = Math.min(backoff ? backoff * 2 : 2000, 30000);

      setTimeout(() => flush(), backoff);
    } finally {
      flushing.value = false;
    }
  }

  function flushBeacon() {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
    if (!hasPending.value) return;

    const payload = buildPayloadFor(currentSnapshot());

    if (isEmptyPayload(payload)) return;

    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });

    navigator.sendBeacon("/api/nodes/save", blob);
  }

  function clearFlushed(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.delete(id);
    for (const key of snapshot.dirtyComponents)
      dirtyComponents.value.delete(key);

    for (const key of snapshot.deletedComponents)
      deletedComponents.value.delete(key);

    deletedNodes.value = deletedNodes.value.filter(
      (d) => !snapshot.deletedNodes.includes(d),
    );
  }

  function restoreSnapshot(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.add(id);

    // A key re-queued the other way while the flush was in flight is the newer
    // intent. Restoring over it would put the same key in both sets, and the
    // server applies deletes last — so a re-added component would be destroyed.
    for (const key of snapshot.dirtyComponents) {
      if (!deletedComponents.value.has(key)) dirtyComponents.value.add(key);
    }
    for (const key of snapshot.deletedComponents) {
      if (!dirtyComponents.value.has(key)) deletedComponents.value.add(key);
    }

    for (const d of snapshot.deletedNodes) {
      if (!deletedNodes.value.includes(d)) deletedNodes.value.push(d);
    }
  }

  return {
    status,
    hasPending,
    enqueueNode,
    enqueueComponent,
    enqueueComponentDelete,
    enqueueDelete,
    dropNode,
    dropSlide,
    flush,
    flushBeacon,
    scheduleFlush,
  };
});
