import {
  buildSavePayload,
  componentKey,
  type DeleteNode,
  type OutboxSnapshot,
} from "~/utils/outbox";
import type { SaveStatus } from "#shared/types";

export const useDeckSync = defineStore("deck-sync", () => {
  const apiFetch = useRequestFetch();

  const dirtyNodes = ref<Set<string>>(new Set());
  const deletedNodes = ref<DeleteNode[]>([]);
  const dirtyComponents = ref<Set<string>>(new Set());

  const status = ref<SaveStatus>("idle");
  const flushing = ref(false);

  let backoff = 0;

  const hasPending = computed(
    () =>
      dirtyNodes.value.size > 0 ||
      deletedNodes.value.length > 0 ||
      dirtyComponents.value.size > 0,
  );

  function enqueueNode(id: string) {
    dirtyNodes.value.add(id);

    scheduleFlush();
  }

  function enqueueComponent(node: string, type: string) {
    dirtyComponents.value.add(componentKey(node, type));

    scheduleFlush();
  }

  function dropNode(id: string) {
    dirtyNodes.value.delete(id);

    for (const key of [...dirtyComponents.value]) {
      if (key.startsWith(`${id}:`)) dirtyComponents.value.delete(key);
    }
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
    };
  }

  function buildPayloadFor(snapshot: OutboxSnapshot) {
    const store = useDeckStore();

    return buildSavePayload(
      snapshot,
      (id) => store.getNodeById(id),
      (key) => {
        const [node, type] = key.split(":");
        return store.getComponent(node!, type!);
      },
    );
  }

  async function flush(): Promise<void> {
    if (flushing.value || !hasPending.value) return;

    const snapshot = currentSnapshot();
    const payload = buildPayloadFor(snapshot);

    if (
      !payload.nodesToUpsert.length &&
      !payload.nodesToDelete.length &&
      !payload.componentsToUpsert.length
    ) {
      clearFlushed(snapshot);

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

    if (
      !payload.nodesToUpsert.length &&
      !payload.nodesToDelete.length &&
      !payload.componentsToUpsert.length
    )
      return;

    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });

    navigator.sendBeacon("/api/nodes/save", blob);
  }

  function clearFlushed(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.delete(id);
    for (const key of snapshot.dirtyComponents)
      dirtyComponents.value.delete(key);

    deletedNodes.value = deletedNodes.value.filter(
      (d) => !snapshot.deletedNodes.includes(d),
    );
  }

  function restoreSnapshot(snapshot: OutboxSnapshot) {
    for (const id of snapshot.dirtyNodes) dirtyNodes.value.add(id);
    for (const key of snapshot.dirtyComponents) dirtyComponents.value.add(key);
    for (const d of snapshot.deletedNodes) {
      if (!deletedNodes.value.includes(d)) deletedNodes.value.push(d);
    }
  }

  return {
    status,
    hasPending,
    enqueueNode,
    enqueueComponent,
    enqueueDelete,
    dropNode,
    flush,
    flushBeacon,
    scheduleFlush,
  };
});
